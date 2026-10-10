import { Role, RequestType, RequestStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AuthenticatedUser } from "../middlewares/auth.middleware";
import { createActiveClientCore, invalidateClientCache } from "./client.service";
import { broadcastSseEvent } from "./sse.service";
import { sendWelcomeEmail } from "./email.service";

export type HierarchicalAction =
  | "EDIT_CLIENT"
  | "TRANSFER_CLIENT"
  | "DELETE_CLIENT"
  | "EDIT_EMPLOYEE"
  | "TRANSFER_EMPLOYEE"
  | "DELETE_EMPLOYEE"
  | "NEW_SERVICE"
  | "BUDGET_INCREASE";

/**
 * Resolves the deterministic required approval chain based on role & action.
 * Empty array indicates the role can perform the action directly.
 */
export function resolveApprovalChain(action: string, requesterRole: Role): Role[] {
  switch (action) {
    case "EDIT_CLIENT":
      if (requesterRole === Role.SALES_PERSON) return [Role.MANAGER];
      if (requesterRole === Role.MANAGER) return [Role.BRANCH_MANAGER];
      return []; // Branch Manager & Owner execute directly

    case "TRANSFER_CLIENT":
      if (requesterRole === Role.SALES_PERSON) return [Role.MANAGER];
      if (requesterRole === Role.MANAGER) return [Role.BRANCH_MANAGER];
      return []; // Branch Manager & Owner execute directly

    case "DELETE_CLIENT":
      if (requesterRole === Role.SALES_PERSON) return [Role.MANAGER, Role.BRANCH_MANAGER, Role.OWNER];
      if (requesterRole === Role.MANAGER) return [Role.BRANCH_MANAGER, Role.OWNER];
      if (requesterRole === Role.BRANCH_MANAGER) return [Role.OWNER];
      return []; // Owner executes directly

    case "EDIT_EMPLOYEE":
      if (requesterRole === Role.MANAGER) return [Role.BRANCH_MANAGER];
      return []; // Branch Manager & Owner execute directly

    case "TRANSFER_EMPLOYEE":
      if (requesterRole === Role.BRANCH_MANAGER) return [Role.OWNER];
      return []; // Owner executes directly

    case "DELETE_EMPLOYEE":
      if (requesterRole === Role.MANAGER) return [Role.BRANCH_MANAGER, Role.OWNER];
      if (requesterRole === Role.BRANCH_MANAGER) return [Role.OWNER];
      return []; // Owner executes directly

    case "NEW_SERVICE":
      if (requesterRole === Role.CLIENT) return [Role.SALES_PERSON];
      // Legacy preserved flow: Salesperson -> Sales Manager
      return [Role.MANAGER];

    default:
      return [];
  }
}

/**
 * Helper to map a target role to a readable stage string.
 */
export function getStageForRole(role: Role | string): string {
  if (role === Role.SALES_PERSON || role === "SALES_PERSON") return "PENDING_SALES_PERSON";
  if (role === Role.MANAGER || role === "MANAGER") return "PENDING_SALES_MANAGER";
  if (role === Role.BRANCH_MANAGER || role === "BRANCH_MANAGER") return "PENDING_BRANCH_MANAGER";
  if (role === Role.OWNER || role === "OWNER" || role === Role.ADMIN || role === "ADMIN") return "PENDING_OWNER";
  return "PENDING";
}

/**
 * Checks if the caller has the required role to decide a request at its current stage.
 */
export function isUserAuthorizedForStage(userRole: Role | string, currentStage: string): boolean {
  const roleStr = String(userRole);
  if (roleStr === "OWNER" || roleStr === "ADMIN") {
    // Owner and Admin can oversee or step into any stage
    return true;
  }

  if (currentStage === "PENDING_SALES_PERSON") {
    return roleStr === "SALES_PERSON" || roleStr === "MANAGER";
  }

  if (currentStage === "PENDING_SALES_MANAGER") {
    return roleStr === "MANAGER";
  }

  if (currentStage === "PENDING_BRANCH_MANAGER") {
    return roleStr === "BRANCH_MANAGER";
  }

  if (currentStage === "PENDING_OWNER") {
    return roleStr === "OWNER" || roleStr === "ADMIN";
  }

  // Fallback for legacy requests without currentStage
  return true;
}

/**
 * Centralized decision handler for hierarchical requests.
 * Handles intermediate stage progression vs. final atomic execution.
 */
export async function executeWorkflowDecision(
  user: AuthenticatedUser,
  requestId: string,
  decision: "APPROVED" | "REJECTED",
  managerRemarks?: string
) {
  // 1. Fetch request with relations
  const existingRequest = await prisma.request.findFirst({
    where: { id: requestId, isDeleted: false },
    include: {
      client: true,
      requester: { select: { id: true, fullName: true, role: true, email: true, branchId: true } },
    },
  });

  if (!existingRequest) {
    return { success: false, statusCode: 404, message: "Request not found." };
  }

  if (existingRequest.status !== RequestStatus.PENDING) {
    return {
      success: false,
      statusCode: 400,
      message: `Request is already ${existingRequest.status.toLowerCase()}.`,
    };
  }

  // 2. Determine current stage & approval chain
  const currentStage = (existingRequest as any).currentStage || "PENDING_SALES_MANAGER";
  const rawChain = (existingRequest as any).approvalChain;
  const approvalChain: string[] = Array.isArray(rawChain) && rawChain.length > 0
    ? rawChain
    : resolveApprovalChain(existingRequest.requestType, existingRequest.requester.role);

  const currentChainIndex = typeof (existingRequest as any).currentChainIndex === "number"
    ? (existingRequest as any).currentChainIndex
    : 0;

  // 3. Authorization check
  const isAuthorized =
    isUserAuthorizedForStage(user.role, currentStage) ||
    (existingRequest.requestType === "NEW_SERVICE" && (user.role === Role.SALES_PERSON || String(user.role) === "SALES_PERSON"));

  if (!isAuthorized) {
    return {
      success: false,
      statusCode: 403,
      message: `Access denied. Your role (${user.role}) is not authorized to review requests at stage "${currentStage}".`,
    };
  }

  // 4. Branch tenancy check (Managers and Branch Managers can only review requests from their branch)
  if (user.role === Role.MANAGER || user.role === Role.BRANCH_MANAGER) {
    const userBranchId = user.branchId;
    const requestBranchId = existingRequest.client?.branchId || existingRequest.requester?.branchId;
    if (userBranchId && requestBranchId && userBranchId !== requestBranchId) {
      return {
        success: false,
        statusCode: 403,
        message: "Access denied. You can only review requests belonging to your branch.",
      };
    }
  }

  // 5. Prevent self-approval (unless Owner/Admin)
  if (user.userId === existingRequest.requesterId && String(user.role) !== "OWNER" && String(user.role) !== "ADMIN") {
    return {
      success: false,
      statusCode: 403,
      message: "You cannot approve your own request.",
    };
  }

  // 6. Execute decision in a robust transaction with extended timeout
  const result = await prisma.$transaction(
    async (tx) => {
      const now = new Date();

      // CASE A: REJECTION (Immediately terminates the entire workflow)
      if (decision === "REJECTED") {
        const rejectedRecord = await tx.request.update({
          where: { id: requestId },
          data: {
            status: RequestStatus.REJECTED,
            currentStage: "REJECTED",
            managerRemarks: managerRemarks || null,
            decisionDate: now,
            reviewerId: user.userId,
          } as any,
        });

        // Record audit
        await tx.requestAudit.create({
          data: {
            requestId,
            action: "REJECTED",
            actorId: user.userId,
            actorName: user.email,
            actorRole: user.role,
            stage: currentStage,
            remarks: managerRemarks || "Request rejected.",
          },
        }).catch(() => { });

        return {
          statusCode: 200,
          message: `Request ${existingRequest.requestCode} has been rejected.`,
          data: rejectedRecord,
        };
      }

      // CASE B: APPROVAL
      // Record audit for this approval step
      await tx.requestAudit.create({
        data: {
          requestId,
          action: "APPROVED",
          actorId: user.userId,
          actorName: user.email,
          actorRole: user.role,
          stage: currentStage,
          remarks: managerRemarks || "Approved at stage.",
        },
      }).catch(() => { });

      const nextChainIndex = currentChainIndex + 1;
      const isFinalApproval = nextChainIndex >= approvalChain.length;

      // Sub-case B1: Intermediate Approval (Forward to next level, do NOT apply changes yet)
      if (!isFinalApproval) {
        const nextRole = approvalChain[nextChainIndex];
        const nextStage = getStageForRole(nextRole);

        const advancedRecord = await tx.request.update({
          where: { id: requestId },
          data: {
            currentChainIndex: nextChainIndex,
            currentStage: nextStage,
            reviewerId: user.userId,
            managerRemarks: managerRemarks || null,
          } as any,
        });

        return {
          statusCode: 200,
          message: `Request approved by ${user.role} and forwarded to ${nextRole} for review.`,
          data: advancedRecord,
        };
      }

      // Sub-case B2: Final Required Approval (Owner or designated final approver)
      // Apply the concrete mutation atomically!
      const targetClientId = existingRequest.clientId || (existingRequest as any).targetEntityId;

      if (existingRequest.requestType === RequestType.DELETE_CLIENT) {
        if (targetClientId) {
          const clientBeforeDelete = await tx.client.findUnique({
            where: { id: targetClientId },
            select: { salesPersonId: true, email: true },
          });

          const softDeletedClient = await tx.client.update({
            where: { id: targetClientId },
            data: {
              isDeleted: true,
              deletedAt: now,
              deletedById: user.userId,
              deleteReason: existingRequest.reason || managerRemarks || "Client deleted via workflow request",
              lastSalesPersonId: clientBeforeDelete?.salesPersonId || null,
            },
          });

          // Soft delete client login account if no other active clients exist
          if (softDeletedClient?.email) {
            const activeRemaining = await tx.client.count({
              where: { email: softDeletedClient.email, isDeleted: false },
            });
            if (activeRemaining === 0) {
              await tx.user.updateMany({
                where: { email: softDeletedClient.email, role: Role.CLIENT },
                data: { isDeleted: true, deletedAt: now },
              });
            }
          }
        }
      } else if (existingRequest.requestType === RequestType.EDIT_CLIENT) {
        if (targetClientId && existingRequest.requestedChanges) {
          const changes = Array.isArray(existingRequest.requestedChanges)
            ? existingRequest.requestedChanges
            : [];
          const updatePayload: any = {};

          changes.forEach((c: any) => {
            if (c.field === "Company Name") updatePayload.companyName = c.newValue;
            if (c.field === "Contact Person") updatePayload.contactPerson = c.newValue;
            if (c.field === "Phone Number" || c.field === "Phone") updatePayload.phone = c.newValue;
            if (c.field === "Email") updatePayload.email = c.newValue;
            if (c.field === "Address") updatePayload.address = c.newValue;
            if (c.field === "Milestone Stage" || c.field === "Target Stage" || c.field === "applicationStatus") {
              const targetStage = String(c.newValue).split(" (")[0].trim();
              updatePayload.applicationStatus = targetStage;
            }
          });

          if (Object.keys(updatePayload).length > 0) {
            await tx.client.update({
              where: { id: targetClientId },
              data: updatePayload,
            });
          }

          // If requested changes also specify salesperson profile designation and quota
          let newDesignation: string | undefined;
          let newQuota: number | undefined;
          changes.forEach((c: any) => {
            if (c.field === "Salesperson Designation" || c.field === "Designation" || c.field === "Representative Role") {
              newDesignation = String(c.newValue).trim();
            }
            if (c.field === "Salesperson Quota" || c.field === "Quota" || c.field === "Target Quota") {
              const parsed = parseFloat(String(c.newValue).replace(/[^0-9.]/g, ""));
              if (!isNaN(parsed)) newQuota = parsed;
            }
          });

          if (newDesignation !== undefined || newQuota !== undefined) {
            const clientRec = await tx.client.findUnique({
              where: { id: targetClientId },
              select: { salesPersonId: true },
            });
            if (clientRec?.salesPersonId) {
              const repUpdates: any = {};
              if (newDesignation) repUpdates.designation = newDesignation;
              if (newQuota !== undefined) repUpdates.targetQuota = newQuota;
              await tx.user.update({
                where: { id: clientRec.salesPersonId },
                data: repUpdates,
              });
            }
          }
        }
      } else if (String(existingRequest.requestType) === "TRANSFER_CLIENT") {
        if (targetClientId && existingRequest.requestedChanges) {
          const clientBefore = await tx.client.findUnique({
            where: { id: targetClientId },
            include: { payments: true },
          });

          if (clientBefore) {
            const payload = existingRequest.requestedChanges as any;
            const transferData: any = {};

            if (payload.targetSalesPersonId) transferData.salesPersonId = payload.targetSalesPersonId;
            if (payload.targetBranchId) transferData.branchId = payload.targetBranchId;

            // If payload contains field array or object
            if (Array.isArray(payload)) {
              for (const p of payload) {
                if (p.targetSalesPersonId) transferData.salesPersonId = p.targetSalesPersonId;
                if (p.targetBranchId) transferData.branchId = p.targetBranchId;
                if (p.field === "Assigned Representative" || p.field === "Assigned Sales Representative" || p.field === "Managing Sales Rep") {
                  if (p.newValue && !transferData.salesPersonId) {
                    const foundUser = await tx.user.findFirst({
                      where: { fullName: { equals: p.newValue, mode: "insensitive" }, isDeleted: false },
                    });
                    if (foundUser) {
                      transferData.salesPersonId = foundUser.id;
                      if (!transferData.branchId && foundUser.branchId) {
                        transferData.branchId = foundUser.branchId;
                      }
                    }
                  }
                }
                if (p.field === "Branch Reallocation" || p.field === "Branch / Territory Reassignment") {
                  if (p.newValue && !transferData.branchId) {
                    const foundBranch = await tx.branch.findFirst({
                      where: {
                        OR: [
                          { name: { contains: p.newValue, mode: "insensitive" } },
                          { region: { contains: p.newValue, mode: "insensitive" } },
                        ],
                      },
                    });
                    if (foundBranch) transferData.branchId = foundBranch.id;
                  }
                }
              }
            } else if (payload.destinationBranch) {
              const foundBranch = await tx.branch.findFirst({
                where: {
                  OR: [
                    { name: { contains: payload.destinationBranch, mode: "insensitive" } },
                    { region: { contains: payload.destinationBranch, mode: "insensitive" } },
                  ],
                },
              });
              if (foundBranch) transferData.branchId = foundBranch.id;
            }

            // Calculate collected and pending at moment of transfer
            const collectedPaymentsSum = (clientBefore.payments || []).reduce((sum: number, pay: any) => sum + Number(pay.amount || 0), 0);
            const collectedBeforeTransfer = collectedPaymentsSum > 0 ? collectedPaymentsSum : Number(clientBefore.paymentReceived || 0);
            const totalContract = Number(clientBefore.totalPayment || 0);
            const pendingAtTransfer = Math.max(0, totalContract - collectedBeforeTransfer);

            const fromSalesPersonId = clientBefore.salesPersonId;
            const toSalesPersonId = transferData.salesPersonId || fromSalesPersonId;
            const fromBranchId = clientBefore.branchId;
            const toBranchId = transferData.branchId || fromBranchId;

            // Create transfer log
            await tx.clientTransferLog.create({
              data: {
                clientId: targetClientId,
                fromSalesPersonId,
                toSalesPersonId,
                fromBranchId,
                toBranchId,
                collectedBeforeTransfer,
                pendingAtTransfer,
                reason: existingRequest.reason || managerRemarks || "Client transfer executed",
                transferredAt: now,
              },
            });

            if (Object.keys(transferData).length > 0) {
              await tx.client.update({
                where: { id: targetClientId },
                data: transferData,
              });
            }
          }
        }
      } else if (String(existingRequest.requestType) === "DELETE_EMPLOYEE") {
        const targetUserId = (existingRequest as any).targetEntityId;
        if (targetUserId) {
          await tx.user.update({
            where: { id: targetUserId },
            data: { isDeleted: true, deletedAt: now, status: "Inactive" },
          });
        }
      } else if (String(existingRequest.requestType) === "EDIT_EMPLOYEE") {
        const targetUserId = (existingRequest as any).targetEntityId;
        if (targetUserId && existingRequest.requestedChanges) {
          const changes = Array.isArray(existingRequest.requestedChanges)
            ? existingRequest.requestedChanges
            : [];
          const userUpdates: any = {};
          changes.forEach((c: any) => {
            if (c.field === "Name" || c.field === "fullName") userUpdates.fullName = c.newValue;
            if (c.field === "Email") userUpdates.email = c.newValue;
            if (c.field === "Phone") userUpdates.phone = c.newValue;
            if (c.field === "Region") userUpdates.region = c.newValue;
            if (c.field === "Role" || c.field === "Designation" || c.field === "Salesperson Designation") {
              userUpdates.designation = c.newValue;
            }
            if (c.field === "Quota" || c.field === "Salesperson Quota" || c.field === "Target Quota") {
              const parsed = parseFloat(String(c.newValue).replace(/[^0-9.]/g, ""));
              if (!isNaN(parsed)) userUpdates.targetQuota = parsed;
            }
          });
          if (Object.keys(userUpdates).length > 0) {
            await tx.user.update({
              where: { id: targetUserId },
              data: userUpdates,
            });
          }
        }
      } else if (String(existingRequest.requestType) === "TRANSFER_EMPLOYEE") {
        const targetUserId = (existingRequest as any).targetEntityId;
        const payload = existingRequest.requestedChanges as any;
        if (targetUserId) {
          const userBefore = await tx.user.findUnique({
            where: { id: targetUserId },
          });

          if (userBefore) {
            const userTransfer: any = {};
            if (payload?.targetBranchId) userTransfer.branchId = payload.targetBranchId;
            if (payload?.targetManagerId) userTransfer.reportingManagerId = payload.targetManagerId;

            if (Array.isArray(payload)) {
              for (const p of payload) {
                if (p.targetBranchId) userTransfer.branchId = p.targetBranchId;
                if (p.targetManagerId) userTransfer.reportingManagerId = p.targetManagerId;
                if (p.field === "Destination Branch" || p.field === "Branch Reallocation" || p.field === "Target Branch") {
                  if (p.newValue && !userTransfer.branchId) {
                    const foundBranch = await tx.branch.findFirst({
                      where: {
                        OR: [
                          { name: { contains: p.newValue, mode: "insensitive" } },
                          { region: { contains: p.newValue, mode: "insensitive" } },
                        ],
                      },
                    });
                    if (foundBranch) userTransfer.branchId = foundBranch.id;
                  }
                }
                if (p.field === "Reporting Manager" || p.field === "New Reporting Manager") {
                  if (p.newValue && !userTransfer.reportingManagerId) {
                    const foundMgr = await tx.user.findFirst({
                      where: { fullName: { contains: p.newValue, mode: "insensitive" }, isDeleted: false },
                    });
                    if (foundMgr) userTransfer.reportingManagerId = foundMgr.id;
                  }
                }
              }
            } else if (payload?.destinationBranch) {
              const foundBranch = await tx.branch.findFirst({
                where: {
                  OR: [
                    { name: { contains: payload.destinationBranch, mode: "insensitive" } },
                    { region: { contains: payload.destinationBranch, mode: "insensitive" } },
                  ],
                },
              });
              if (foundBranch) userTransfer.branchId = foundBranch.id;
            }

            const fromBranchId = userBefore.branchId;
            const toBranchId = userTransfer.branchId || fromBranchId;
            const fromManagerId = userBefore.reportingManagerId;
            const toManagerId = userTransfer.reportingManagerId || fromManagerId;

            // Preserve originBranchId if not already set
            if (!userBefore.originBranchId && fromBranchId) {
              userTransfer.originBranchId = fromBranchId;
            }
            if (!userBefore.initialManagerId && fromManagerId) {
              userTransfer.initialManagerId = fromManagerId;
            }

            // Create employee transfer log
            await tx.employeeTransferLog.create({
              data: {
                userId: targetUserId,
                fromBranchId,
                toBranchId,
                fromManagerId,
                toManagerId,
                reason: existingRequest.reason || managerRemarks || "Employee transfer executed",
                transferredAt: now,
              },
            });

            if (Object.keys(userTransfer).length > 0) {
              await tx.user.update({
                where: { id: targetUserId },
                data: userTransfer,
              });
            }
          }
        }
      } else if (existingRequest.requestType === RequestType.NEW_SERVICE) {
        // Preserved salesperson client registration approval & secondary scheme provisioning
        if (existingRequest.requestedChanges) {
          const payload = existingRequest.requestedChanges as any;
          let existingClient = null;
          if (existingRequest.clientId) {
            existingClient = await tx.client.findUnique({
              where: { id: existingRequest.clientId },
            });
          }

          const targetEmail = payload.clientEmail || payload.email || existingClient?.email;
          const targetScheme = payload.schemeName || payload.serviceName;

          if (targetEmail && targetScheme) {
            // Check if client already exists (if so, this new enrollment is secondary; if not, this first enrollment is primary)
            const priorClient = await tx.client.findFirst({
              where: { email: { equals: targetEmail, mode: "insensitive" }, isDeleted: false },
            });
            const isSecondary = !!priorClient || payload.isPrimary === false || payload.processType === "secondary";

            const clientPayload = {
              companyName: existingClient?.companyName || priorClient?.companyName || payload.companyName || payload.clientName || payload.name || "Client Company",
              contactPerson: existingClient?.contactPerson || priorClient?.contactPerson || payload.clientName || payload.contactPerson || payload.name || "Representative",
              name: existingClient?.name || priorClient?.name || payload.companyName || payload.clientName || payload.name || "Client Company",
              email: targetEmail,
              phone: existingClient?.phone || priorClient?.phone || payload.phone || "+91 98765 43210",
              address: existingClient?.address || priorClient?.address || payload.address,
              serviceType: payload.serviceType || "CONSULTANCY",
              serviceName: targetScheme,
              amount: Number(payload.totalPayment ?? payload.amount ?? payload.pitchedAmount ?? payload.price ?? 0),
              paymentMode: payload.paymentMode ? String(payload.paymentMode).toUpperCase() : "ONLINE",
              paymentReceived: Number(payload.paymentReceived ?? payload.receivedAmount ?? 0),
              fundingRequirement: Number(payload.amountRequired || payload.fundingRequirement || existingClient?.fundingRequirement || priorClient?.fundingRequirement || 1000000),
              adminNotes: payload.notes || payload.detail || payload.adminNotes,
              isPrimary: !isSecondary,
              processType: isSecondary ? "secondary" : "primary",
            };

            const salesPersonId = payload.resolvedSalesPersonId || existingClient?.salesPersonId || priorClient?.salesPersonId || existingRequest.requesterId || user.userId;
            const branchId = payload.resolvedBranchId || existingClient?.branchId || priorClient?.branchId || user.branchId || "";

            const newClient = await createActiveClientCore(
              tx,
              clientPayload,
              salesPersonId,
              branchId,
              "ACTIVE"
            );

            await tx.request.update({
              where: { id: existingRequest.id },
              data: { clientId: newClient.id },
            });
          } else if (!existingRequest.clientId) {
            const newClient = await createActiveClientCore(
              tx,
              payload,
              payload.resolvedSalesPersonId || existingRequest.requesterId,
              payload.resolvedBranchId || "",
              "ACTIVE"
            );
            await tx.request.update({
              where: { id: existingRequest.id },
              data: { clientId: newClient.id },
            });
          }
        }
      }

      // Mark request as fully approved and applied
      const finalRecord = await tx.request.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.APPROVED,
          currentStage: "APPLIED",
          decisionDate: now,
          reviewerId: user.userId,
          managerRemarks: managerRemarks || null,
        } as any,
      });

      // Record applied audit
      await tx.requestAudit.create({
        data: {
          requestId,
          action: "APPLIED",
          actorId: user.userId,
          actorName: user.email,
          actorRole: user.role,
          stage: "APPLIED",
          remarks: "Changes committed to database upon final authorization.",
        },
      }).catch(() => { });

      return {
        statusCode: 200,
        message: `Request ${existingRequest.requestCode} approved and changes applied successfully.`,
        data: finalRecord,
      };
    },
    {
      maxWait: 15000,
      timeout: 30000,
    }
  );

  // Invalidate cache and broadcast real-time event to all connected reps, managers, and admins
  if (result.statusCode === 200) {
    invalidateClientCache();

    const clientName =
      existingRequest.client?.name ||
      existingRequest.client?.companyName ||
      (existingRequest.requestedChanges as any)?.companyName ||
      (existingRequest.requestedChanges as any)?.name ||
      "Client";

    const targetSalesPersonId =
      existingRequest.requesterId ||
      existingRequest.client?.salesPersonId ||
      (existingRequest.requestedChanges as any)?.resolvedSalesPersonId;

    const targetSalesPersonEmail = existingRequest.requester?.email || null;

    // Persist targeted notification in database for the specific salesperson who owns the client
    if (targetSalesPersonId) {
      await prisma.notification.create({
        data: {
          title: decision === "APPROVED"
            ? `Client Request Approved`
            : `Client Request Rejected`,
          detail: decision === "APPROVED"
            ? `Your request for "${clientName}" was approved by ${user.role}!`
            : `Your request for "${clientName}" was rejected: ${managerRemarks || "No remarks"}`,
          issuer: user.email || "Sales Manager",
          tone: decision === "APPROVED" ? "green" : "red",
          userId: targetSalesPersonId,
        },
      }).catch((e) => console.warn("Failed to create DB notification for requester:", e));
    }

    broadcastSseEvent({
      type: decision === "APPROVED" ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
      payload: {
        requestId,
        requestCode: existingRequest.requestCode,
        requestType: existingRequest.requestType,
        decision,
        reviewerId: user.userId,
        reviewerEmail: user.email,
        reviewerRole: user.role,
        requesterId: existingRequest.requesterId,
        requesterEmail: targetSalesPersonEmail,
        targetSalesPersonId: targetSalesPersonId,
        targetSalesPersonEmail: targetSalesPersonEmail,
        clientId: existingRequest.clientId || (existingRequest as any).targetEntityId,
        clientName: clientName,
        managerRemarks: managerRemarks || null,
        message: result.message,
        data: result.data,
      },
    });

    const isNewClientApproval =
      (existingRequest.requestType === RequestType.NEW_SERVICE ||
       String(existingRequest.requestType || "").toUpperCase() === "NEW_SERVICE" ||
       String(existingRequest.reason || "").toLowerCase().includes("new client registration")) &&
      decision === "APPROVED";

    if (isNewClientApproval) {
      let payload = existingRequest.requestedChanges as any;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch (_) {}
      }

      let targetEmail = payload?.email || existingRequest.client?.email;
      let contactPerson = payload?.contactPerson || existingRequest.client?.contactPerson || existingRequest.client?.name || "Client";
      let companyName = payload?.companyName || existingRequest.client?.companyName || existingRequest.client?.name || "";

      // Fallback: If targetEmail is still missing but we have clientId, query the newly created client directly
      if (!targetEmail && existingRequest.clientId) {
        try {
          const clientRec = await prisma.client.findUnique({
            where: { id: existingRequest.clientId },
            select: { email: true, contactPerson: true, companyName: true, name: true },
          });
          if (clientRec) {
            targetEmail = clientRec.email;
            contactPerson = clientRec.contactPerson || clientRec.name || contactPerson;
            companyName = clientRec.companyName || clientRec.name || companyName;
          }
        } catch (dbErr) {
          console.warn("[Workflow] Error fetching client for welcome email:", dbErr);
        }
      }

      if (targetEmail) {
        console.log(`[Workflow] Triggering welcome email to approved client: ${targetEmail} (${contactPerson} / ${companyName})`);
        sendWelcomeEmail(targetEmail, contactPerson, companyName)
          .then((sent) => {
            if (sent) {
              console.log(`[Workflow] ✓ Welcome email successfully delivered to ${targetEmail}`);
            } else {
              console.warn(`[Workflow] ⚠️ Welcome email could not be delivered to ${targetEmail}`);
            }
          })
          .catch((err) => console.error("[Workflow] ✕ Failed to send welcome email:", err));
      } else {
        console.warn(`[Workflow] ⚠️ No email address found for approved request ${existingRequest.requestCode || requestId}; skipping welcome email.`);
      }
    }

  }

  return {
    success: true,
    statusCode: result.statusCode,
    message: result.message,
    data: result.data,
  };
}
