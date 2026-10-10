import { RequestType, RequestStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AuthenticatedUser } from "../middlewares/auth.middleware";
import { generateRequestCode } from "../utils/idGenerator";
import { broadcastSseEvent } from "./sse.service";
import {
  resolveApprovalChain,
  getStageForRole,
  executeWorkflowDecision,
} from "./workflow.service";

export interface CreateRequestInput {
  clientId?: string;
  targetEntityId?: string;
  targetEntityType?: "CLIENT" | "EMPLOYEE";
  requestType: RequestType | string;
  requestedChanges?: any;
  reason: string;
}

const requestsCache = new Map<string, { timestamp: number; data: any }>();
const REQUESTS_CACHE_TTL_MS = 3000;

export function invalidateRequestsCache() {
  requestsCache.clear();
}

export async function getRequestsService(user: AuthenticatedUser) {
  const cacheKey = `${user.userId}_${user.role}_${user.branchId || ""}`;
  const now = Date.now();
  const cached = requestsCache.get(cacheKey);
  if (cached && now - cached.timestamp < REQUESTS_CACHE_TTL_MS) {
    return cached.data;
  }

  let whereClause: any = { isDeleted: false };

  if (user.role === "SALES_PERSON") {
    whereClause.OR = [
      { requesterId: user.userId },
      { client: { salesPersonId: user.userId } },
      { client: { salesPerson: { email: { equals: user.email, mode: "insensitive" } } } },
      { targetEntityId: user.userId },
    ];
  } else if (user.role === "CLIENT") {
    whereClause.OR = [
      { requesterId: user.userId },
      { client: { email: { equals: user.email, mode: "insensitive" } } },
    ];
  } else if (user.role === "MANAGER" || user.role === "BRANCH_MANAGER" || user.role === "ADMIN" || user.role === "OWNER") {
    let targetBranchId = user.branchId;
    if (!targetBranchId) {
      const dbUser = await prisma.user.findFirst({
        where: { id: user.userId, isDeleted: false },
        select: { branchId: true },
      });
      targetBranchId = dbUser?.branchId || undefined;
    }
    if (targetBranchId && user.role !== "OWNER" && user.role !== "ADMIN") {
      whereClause.OR = [
        { reviewerId: user.userId },
        { client: { branchId: targetBranchId } },
        { requesterId: user.userId },
        { requester: { branchId: targetBranchId } },
      ];
    }
    // OWNER sees all branch governance requests (excluding secondary scheme sales requests which are approved by Sales/Managers)
    if (user.role === "OWNER") {
      whereClause.requestType = { not: RequestType.NEW_SERVICE };
    }
  }

  const requests = await prisma.request.findMany({
    where: whereClause,
    include: {
      client: {
        include: {
          salesPerson: { select: { id: true, fullName: true, email: true, phone: true } },
        },
      },
      requester: { select: { id: true, fullName: true, role: true, email: true } },
      reviewer: { select: { id: true, fullName: true, role: true, email: true } },
      auditHistory: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Enrich employee requests with target employee user info if available
  const employeeTargetIds = requests
    .filter((r) => r.targetEntityType === "EMPLOYEE" && r.targetEntityId)
    .map((r) => r.targetEntityId as string);

  let targetUsersMap = new Map<string, any>();
  if (employeeTargetIds.length > 0) {
    const targetUsers = await prisma.user.findMany({
      where: { id: { in: employeeTargetIds } },
      select: { id: true, fullName: true, email: true, phone: true, role: true, designation: true, targetQuota: true },
    });
    targetUsers.forEach((u) => targetUsersMap.set(u.id, u));
  }

  const enrichedRequests = requests.map((r) => {
    const targetUser = r.targetEntityId ? targetUsersMap.get(r.targetEntityId) : null;
    return {
      ...r,
      targetUser: targetUser || null,
      salesPerson: targetUser
        ? { fullName: targetUser.fullName, email: targetUser.email, id: targetUser.id }
        : (r.client?.salesPerson || null),
    };
  });

  // Filter requests by role-specific governance:
  let finalRequests: any[] = enrichedRequests;

  if (user.role === "MANAGER" || user.role === "BRANCH_MANAGER" || user.role === "ADMIN" || user.role === "OWNER") {
    // Payment demands and settlement verification are exclusively between the client and their designated salesperson.
    // Managers, Branch Managers, Admins, and Owners should NOT receive payment requests/settlements.
    finalRequests = enrichedRequests.filter((r) => {
      const changes = r.requestedChanges as any;
      const isPaymentSettlement =
        changes?.isPaymentSettlement === true ||
        changes?.category === "Payment Settlement" ||
        String(r.reason || "").toLowerCase().includes("payment settlement") ||
        String(r.reason || "").toLowerCase().includes("payment demand") ||
        String(r.reason || "").toLowerCase().includes("payment request");
      return !isPaymentSettlement;
    });
  } else if (user.role === "SALES_PERSON") {
    // For salespeople: verify that any request strictly belongs to this salesperson or their assigned client
    finalRequests = enrichedRequests.filter((r) => {
      const isRequester = r.requesterId === user.userId || r.requester?.email?.toLowerCase() === user.email.toLowerCase();
      const isTarget = r.targetEntityId === user.userId;
      const isAssignedSalesPerson =
        r.client?.salesPersonId === user.userId ||
        r.client?.salesPerson?.email?.toLowerCase() === user.email.toLowerCase();
      const changes = r.requestedChanges as any;
      const changesSalesPersonEmail = (changes?.salesPersonEmail || "").toLowerCase();
      const changesMatch = Boolean(changesSalesPersonEmail && changesSalesPersonEmail === user.email.toLowerCase());

      return isRequester || isTarget || isAssignedSalesPerson || changesMatch;
    });
  }

  const result = { success: true, statusCode: 200, count: finalRequests.length, data: finalRequests };
  requestsCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}

export async function createRequestService(user: AuthenticatedUser, data: CreateRequestInput) {
  const requestCode = generateRequestCode();
  const rawReqType = String(data.requestType);
  const approvalChain = resolveApprovalChain(rawReqType, user.role);
  const currentStage = approvalChain.length > 0 ? getStageForRole(approvalChain[0]) : "PENDING_SALES_MANAGER";
  const entityType = data.targetEntityType || (data.clientId ? "CLIENT" : "EMPLOYEE");
  let resolvedClientId: string | null = data.clientId || (entityType === "CLIENT" ? data.targetEntityId || null : null);

  // If requester is a client, safely resolve valid clientId in database
  if (user.role === "CLIENT") {
    let clientRecord = null;
    if (resolvedClientId) {
      clientRecord = await prisma.client.findFirst({
        where: { id: resolvedClientId, isDeleted: false },
      });
    }
    if (!clientRecord) {
      clientRecord = await prisma.client.findFirst({
        where: { email: { equals: user.email, mode: "insensitive" }, isDeleted: false },
      });
    }
    resolvedClientId = clientRecord?.id || null;
  }

  const entityId = data.targetEntityId || resolvedClientId;

  // Prevent duplicate pending requests for the same scheme
  if (rawReqType === "NEW_SERVICE") {
    const changes = data.requestedChanges as any;
    const targetScheme = changes?.schemeName || changes?.name || "";
    if (targetScheme) {
      const normS = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const targetNorm = normS(targetScheme);

      const existingPending = await prisma.request.findMany({
        where: {
          requestType: "NEW_SERVICE" as any,
          status: RequestStatus.PENDING,
          isDeleted: false,
          OR: [
            data.clientId ? { clientId: data.clientId } : undefined,
            user.userId ? { requesterId: user.userId } : undefined,
            user.email ? { client: { email: { equals: user.email, mode: "insensitive" } } } : undefined,
          ].filter(Boolean) as any,
        },
      });

      const duplicate = existingPending.find((r) => {
        const payload = r.requestedChanges as any;
        const rScheme = payload?.schemeName || payload?.name || r.reason || "";
        return normS(rScheme) === targetNorm;
      });

      if (duplicate) {
        return {
          success: true,
          statusCode: 200,
          message: `Application request for ${targetScheme} is already pending review.`,
          data: duplicate,
        };
      }
    }
  }

  const newRequest = await prisma.request.create({
    data: {
      requestCode,
      requestType: rawReqType as any,
      requestedChanges: data.requestedChanges ? (data.requestedChanges as any) : [],
      reason: data.reason,
      status: RequestStatus.PENDING,
      clientId: resolvedClientId || null,
      targetEntityType: entityType,
      targetEntityId: entityId || null,
      currentStage: currentStage,
      approvalChain: approvalChain,
      currentChainIndex: 0,
      requesterId: user.userId,
    } as any,
    include: { client: true, requester: true },
  });

  // Record audit entry for initial request submission
  await prisma.requestAudit.create({
    data: {
      requestId: newRequest.id,
      action: "SUBMITTED",
      actorId: user.userId,
      actorName: user.email,
      actorRole: user.role,
      stage: currentStage,
      remarks: data.reason,
    },
  }).catch(() => {});

  invalidateRequestsCache();

  // Broadcast real-time SSE event to all connected devices across laptops
  broadcastSseEvent({
    type: "REQUEST_CREATED",
    payload: {
      requestId: newRequest.id,
      requestCode: newRequest.requestCode,
      requestType: newRequest.requestType,
      clientId: resolvedClientId || null,
      clientName: newRequest.client?.name || (data.requestedChanges as any)?.clientName || (data.requestedChanges as any)?.companyName || "Client",
      requesterId: user.userId,
      requesterRole: user.role,
      requesterEmail: user.email,
      reason: data.reason,
      data: newRequest,
    },
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
  const result = await executeWorkflowDecision(user, requestId, decision, managerRemarks);
  invalidateRequestsCache();
  return result;
}
