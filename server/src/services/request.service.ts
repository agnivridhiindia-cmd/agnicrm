import { RequestType, RequestStatus, ApprovalStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { createActiveClientCore } from "./client.service";
import { AuthenticatedUser } from "../middlewares/auth.middleware";
import { generateRequestCode } from "../utils/idGenerator";

export interface CreateRequestInput {
  clientId: string;
  requestType: RequestType;
  requestedChanges?: Array<{
    field: string;
    oldValue?: any;
    newValue?: any;
  }>;
  reason: string;
}

export async function getRequestsService(user: AuthenticatedUser) {
  let whereClause: any = { isDeleted: false };

  if (user.role === "SALES_PERSON") {
    whereClause.requesterId = user.userId;
  } else if (user.role === "MANAGER" || user.role === "BRANCH_MANAGER" || user.role === "ADMIN" || user.role === "OWNER") {
    let targetBranchId = user.branchId;
    if (!targetBranchId) {
      const dbUser = await prisma.user.findFirst({
        where: { id: user.userId, isDeleted: false },
        select: { branchId: true },
      });
      targetBranchId = dbUser?.branchId || undefined;
    }
    if (targetBranchId) {
      whereClause.OR = [
        { reviewerId: user.userId },
        { client: { branchId: targetBranchId } },
        { requesterId: user.userId },
        { requester: { branchId: targetBranchId } }
      ];
    }
  }

  const requests = await prisma.request.findMany({
    where: whereClause,
    include: {
      client: true,
      requester: { select: { id: true, fullName: true, role: true, email: true } },
      reviewer: { select: { id: true, fullName: true, role: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, statusCode: 200, count: requests.length, data: requests };
}

export async function createRequestService(user: AuthenticatedUser, data: CreateRequestInput) {
  const requestCode = generateRequestCode();

  const newRequest = await prisma.request.create({
    data: {
      requestCode,
      requestType: data.requestType,
      requestedChanges: data.requestedChanges ? (data.requestedChanges as any) : [],
      reason: data.reason,
      status: RequestStatus.PENDING,
      clientId: data.clientId,
      requesterId: user.userId,
    },
    include: { client: true },
  });

  return {
    success: true,
    statusCode: 201,
    message: "Approval request submitted successfully.",
    data: newRequest,
  };
}

export async function decideRequestService(
  user: AuthenticatedUser,
  requestId: string,
  decision: "APPROVED" | "REJECTED",
  managerRemarks?: string
) {
  const existingRequest = await prisma.request.findFirst({
    where: { id: requestId, isDeleted: false },
    include: { client: true },
  });

  if (!existingRequest) {
    return { success: false, statusCode: 404, message: "Request not found." };
  }

  if (existingRequest.status !== RequestStatus.PENDING) {
    return { success: false, statusCode: 400, message: `Request is already ${existingRequest.status}.` };
  }

  const updatedRequest = await prisma.$transaction(async (tx) => {
    const newStatus = decision === "APPROVED" ? RequestStatus.APPROVED : RequestStatus.REJECTED;

    const reqRecord = await tx.request.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        managerRemarks: managerRemarks || null,
        decisionDate: new Date(),
        reviewerId: user.userId,
      },
    });

    if (decision === "APPROVED") {
      if (existingRequest.requestType === RequestType.NEW_SERVICE) {
        if (!existingRequest.clientId && existingRequest.requestedChanges) {
          const payload = existingRequest.requestedChanges as any;
          const newClient = await createActiveClientCore(
            tx,
            payload,
            payload.resolvedSalesPersonId || existingRequest.requesterId,
            payload.resolvedBranchId || "",
            ApprovalStatus.ACTIVE
          );
          await tx.request.update({
            where: { id: existingRequest.id },
            data: { clientId: newClient.id },
          });
        } else if (existingRequest.clientId) {
          await tx.client.update({
            where: { id: existingRequest.clientId },
            data: { approvalStatus: ApprovalStatus.ACTIVE },
          });
        }
      } else if (existingRequest.requestType === RequestType.EDIT_CLIENT && existingRequest.requestedChanges && existingRequest.clientId) {
        const changes = existingRequest.requestedChanges as Array<{ field: string; newValue: any }>;
        const updatePayload: any = { approvalStatus: ApprovalStatus.ACTIVE };

        changes.forEach((c) => {
          if (c.field === "Company Name") updatePayload.companyName = c.newValue;
          if (c.field === "Contact Person") updatePayload.contactPerson = c.newValue;
          if (c.field === "Phone Number") updatePayload.phone = c.newValue;
          if (c.field === "Email") updatePayload.email = c.newValue;
          if (c.field === "Address") updatePayload.address = c.newValue;
          if (c.field === "Milestone Stage" || c.field === "Target Stage" || c.field === "applicationStatus") {
            const targetStage = String(c.newValue).split(" (")[0].trim();
            updatePayload.applicationStatus = targetStage;
          }
        });

        if (Object.keys(updatePayload).length > 0) {
          await tx.client.update({
            where: { id: existingRequest.clientId },
            data: updatePayload,
          });
        }
      } else if (existingRequest.requestType === RequestType.DELETE_CLIENT && existingRequest.clientId) {
        const deletedClient = await tx.client.update({
          where: { id: existingRequest.clientId },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });

        // If client had an email, check if any active client records remain
        if (deletedClient?.email) {
          const remainingClients = await tx.client.count({
            where: { email: deletedClient.email, isDeleted: false },
          });

          if (remainingClients === 0) {
            // Deactivate the client User login account
            await tx.user.updateMany({
              where: { email: deletedClient.email, role: "CLIENT" },
              data: { isDeleted: true, deletedAt: new Date() },
            });
          }
        }
      }
    } else if (decision === "REJECTED") {
      if (existingRequest.requestType === RequestType.NEW_SERVICE && existingRequest.clientId) {
        await tx.client.update({
          where: { id: existingRequest.clientId },
          data: { approvalStatus: ApprovalStatus.REJECTED },
        });
      }
    }

    return reqRecord;
  });

  return {
    success: true,
    statusCode: 200,
    message: `Request ${decision.toLowerCase()} successfully.`,
    data: updatedRequest,
  };
}
