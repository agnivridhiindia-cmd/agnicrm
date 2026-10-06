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
    let repBranchId = user.branchId;
    if (!repBranchId) {
      const dbUser = await prisma.user.findFirst({
        where: { id: user.userId, isDeleted: false },
        select: { branchId: true },
      });
      repBranchId = dbUser?.branchId || undefined;
    }

    whereClause.OR = [
      { requesterId: user.userId },
      { client: { salesPersonId: user.userId } },
      { targetEntityId: user.userId },
      ...(repBranchId ? [{ client: { branchId: repBranchId } }] : []),
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
      client: true,
      requester: { select: { id: true, fullName: true, role: true, email: true } },
      reviewer: { select: { id: true, fullName: true, role: true, email: true } },
      auditHistory: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = { success: true, statusCode: 200, count: requests.length, data: requests };
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
