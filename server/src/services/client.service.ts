import bcrypt from "bcryptjs";
import { ServiceType, Stage, PaymentMode, Role, ApprovalStatus, DocumentStatus, RequestType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AuthenticatedUser } from "../middlewares/auth.middleware";
import { generateAppId, generateSchemeCode } from "../utils/idGenerator";
import { broadcastSseEvent } from "./sse.service";

export interface CreateClientInput {
  companyName: string;
  contactPerson: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  serviceType: ServiceType;
  serviceName: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentReceived: number;
  gstNo?: string;
  adminNotes?: string;
  salesPersonEmail?: string;
  approvalStatus?: ApprovalStatus;
  fundingRequirement?: number;
}

export interface OnboardProfileInput {
  companyName?: string | null;
  representativeName?: string | null;
  contactNumber?: string | null;
  phone?: string | null;
  address?: string | null;
  businessType?: string | null;
  sector?: string | null;
  companyAge?: string | null;
  annualTurnover?: number | null;
  fundingRequirement?: number | null;
  companyDescription?: string | null;
  fundingPurpose?: string | null;
  gstNumber?: string | null;
  aadharNumber?: string | null;
  panNumber?: string | null;
  msmeNumber?: string | null;
  companyPan?: string | null;
  tanNumber?: string | null;
  cinNumber?: string | null;
  twelveARegNumber?: string | null;
  eightyGCertNumber?: string | null;
  darpanId?: string | null;
}

export interface UpdateClientStatusInput {
  completedSteps: string[];
  applicationStatus: string;
  progressPercent: number;
  adminNotes?: string;
}

export interface UpdateClientInput {
  name?: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  serviceType?: ServiceType;
  serviceName?: string;
  totalPayment?: number;
  paymentReceived?: number;
  completedSteps?: string[];
  applicationStatus?: string;
  progressPercent?: number;
  adminNotes?: string;
}

interface CacheEntry {
  timestamp: number;
  data: any;
}
const clientsCache = new Map<string, CacheEntry>();
const CLIENTS_CACHE_TTL_MS = 3000; // 3-second SWR cache to absorb concurrent polls

let cachedBranches: { timestamp: number; data: any[] } | null = null;
const BRANCHES_CACHE_TTL_MS = 600000; // 10 minutes static branch cache

let cachedUsers: { timestamp: number; data: any[] } | null = null;
const USERS_CACHE_TTL_MS = 60000; // 1 minute user name map cache

export function invalidateClientCache() {
  clientsCache.clear();
}

export async function getClientsService(user: AuthenticatedUser, query?: { deletedOnly?: boolean; includeDeleted?: boolean }) {
  const cacheKey = `${user.userId}_${user.role}_${user.branchId || ""}_${query?.deletedOnly}_${query?.includeDeleted}`;
  const now = Date.now();
  const cached = clientsCache.get(cacheKey);
  if (cached && now - cached.timestamp < CLIENTS_CACHE_TTL_MS) {
    return cached.data;
  }

  let whereClause: any = query?.deletedOnly ? { isDeleted: true } : (query?.includeDeleted ? {} : { isDeleted: false });

  if (user.role === "SALES_PERSON") {
    whereClause.salesPersonId = user.userId;
  } else if (user.role === "BRANCH_MANAGER" || user.role === "MANAGER") {
    // Branch managers and managers see only their branch
    let targetBranchId = user.branchId;
    if (!targetBranchId) {
      const dbUser = await prisma.user.findFirst({
        where: { id: user.userId, isDeleted: false },
        select: { branchId: true },
      });
      targetBranchId = dbUser?.branchId || undefined;
    }
    if (targetBranchId) {
      whereClause.branchId = targetBranchId;
    }
  } else if (user.role === "IT") {
    whereClause.serviceType = ServiceType.IT;
  } else if (user.role === "MARKETING") {
    whereClause.serviceType = ServiceType.MARKETING;
  } else if (user.role === "CLIENT") {
    whereClause.email = { equals: user.email, mode: "insensitive" };
  }
  // ADMIN, OWNER roles: no extra filter — see all clients.
  // Frontend AdminDashboard.jsx handles branch filtering by the admin's selected branch.

  const clients = await prisma.client.findMany({
    where: whereClause,
    include: {
      branch: true,
      salesPerson: { select: { id: true, fullName: true, email: true } },
      originalSalesPerson: { select: { id: true, fullName: true, email: true } },
      lastSalesPerson: { select: { id: true, fullName: true, email: true } },
      deletedByUser: { select: { id: true, fullName: true, email: true } },
      transferLogs: { orderBy: { transferredAt: "desc" } },
      invoices: { where: { isDeleted: false }, include: { payments: { where: { isDeleted: false } } } },
      payments: { where: { isDeleted: false } },
      documents: { where: { isDeleted: false } },
      schemes: { where: { isDeleted: false } },
    },
    orderBy: { createdAt: "desc" },
  });

  let allBranches: any[];
  if (cachedBranches && now - cachedBranches.timestamp < BRANCHES_CACHE_TTL_MS) {
    allBranches = cachedBranches.data;
  } else {
    allBranches = await prisma.branch.findMany({ select: { id: true, name: true, region: true } });
    cachedBranches = { timestamp: now, data: allBranches };
  }

  let allUsers: any[];
  if (cachedUsers && now - cachedUsers.timestamp < USERS_CACHE_TTL_MS) {
    allUsers = cachedUsers.data;
  } else {
    allUsers = await prisma.user.findMany({ select: { id: true, fullName: true, email: true } });
    cachedUsers = { timestamp: now, data: allUsers };
  }
  const branchMap = new Map(allBranches.map((b) => [b.id, b]));
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const cleanedClients = clients.map((c) => {
    const isSec = (c as any).isPrimary === false || (c as any).processType === "secondary" || (c.serviceName && !c.serviceName.toLowerCase().includes("pmegp"));
    
    let compName = c.companyName;
    if (!compName || compName.toLowerCase() === "representative") {
      const primaryMatch = clients.find(p => p.email.toLowerCase() === c.email.toLowerCase() && p.companyName && p.companyName.toLowerCase() !== "representative");
      compName = primaryMatch?.companyName || (c.name && c.name.toLowerCase() !== "representative" ? c.name : "Client Company");
    }

    let contactPerson = c.contactPerson;
    if (!contactPerson || contactPerson.toLowerCase() === "representative") {
      const primaryMatch = clients.find(p => p.email.toLowerCase() === c.email.toLowerCase() && p.contactPerson && p.contactPerson.toLowerCase() !== "representative");
      contactPerson = primaryMatch?.contactPerson || compName;
    }

    let appStatus = c.applicationStatus;
    let progress = c.progressPercent;
    let steps = c.completedSteps;
    if (isSec && (appStatus === "CRM Creation" || progress < 60)) {
      appStatus = "Reports";
      progress = 60;
      steps = ["CRM Creation", "Agreement", "Reports"];
    }

    // Accurate calculation of totalPayment, paymentReceived, and paymentPending across invoices and payments
    const totalPayNum = Number(c.totalPayment || 0);
    const invoicePaymentsSum = (c.invoices || []).reduce((sum: number, inv: any) => sum + Number(inv.paymentReceived || 0), 0);
    const directPaymentsSum = (c.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const payReceivedNum = Math.max(Number(c.paymentReceived || 0), invoicePaymentsSum, directPaymentsSum);
    const payPendingNum = Math.max(0, totalPayNum - payReceivedNum);
    const isPaid = payPendingNum <= 0 && payReceivedNum > 0;

    const enrichedLogs = (c.transferLogs || []).map((log) => ({
      ...log,
      fromSalesPerson: log.fromSalesPersonId ? userMap.get(log.fromSalesPersonId) || null : null,
      toSalesPerson: log.toSalesPersonId ? userMap.get(log.toSalesPersonId) || null : null,
      fromBranch: log.fromBranchId ? branchMap.get(log.fromBranchId)?.name || null : null,
      toBranch: log.toBranchId ? branchMap.get(log.toBranchId)?.name || null : null,
    }));

    return {
      ...c,
      companyName: compName,
      name: compName,
      contactPerson: contactPerson,
      applicationStatus: appStatus,
      progressPercent: progress,
      completedSteps: steps,
      totalPayment: totalPayNum,
      paymentReceived: payReceivedNum,
      paymentPending: payPendingNum,
      paymentStatus: isPaid ? "Paid" : (payReceivedNum > 0 ? "Partial" : "Pending"),
      originalSalesPerson: c.originalSalesPerson,
      lastSalesPerson: c.lastSalesPerson,
      deletedByUser: c.deletedByUser,
      deleteReason: c.deleteReason,
      transferLogs: enrichedLogs,
    };
  });

  const responseData = { success: true, count: cleanedClients.length, data: cleanedClients };
  clientsCache.set(cacheKey, { timestamp: Date.now(), data: responseData });
  return responseData;
}

export async function createClientService(user: AuthenticatedUser, data: CreateClientInput) {
  const newClient = await prisma.$transaction(async (tx) => {
    let resolvedSalesPersonId: string = user.userId;
    let resolvedBranchId: string | null = user.branchId || null;

    if (data.salesPersonEmail) {
      const targetEmail = data.salesPersonEmail.trim().toLowerCase();
      const prefix = targetEmail.split("@")[0].split(".")[0];
      const salesUser = await tx.user.findFirst({
        where: {
          isDeleted: false,
          OR: [
            { email: targetEmail },
            { email: { startsWith: prefix } },
            { fullName: { contains: prefix, mode: "insensitive" } },
          ],
        },
        select: { id: true, branchId: true },
      });
      if (salesUser) {
        resolvedSalesPersonId = salesUser.id;
        resolvedBranchId = salesUser.branchId || resolvedBranchId;
      }
    }

    if (!resolvedBranchId) {
      const defaultBranch = await tx.branch.findFirst();
      if (defaultBranch) resolvedBranchId = defaultBranch.id;
    }

    // Branch code for collision-free appId
    let branchCode = "WZ";
    if (resolvedBranchId) {
      const branchRecord = await tx.branch.findUnique({ where: { id: resolvedBranchId } });
      if (branchRecord?.code) branchCode = branchRecord.code.replace(/[^a-zA-Z0-9]/g, "");
    }

    const initialApprovalStatus =
      data.approvalStatus ||
      (user.role === Role.SALES_PERSON ? ApprovalStatus.PENDING_APPROVAL : ApprovalStatus.ACTIVE);

    if (initialApprovalStatus === ApprovalStatus.PENDING_APPROVAL) {
      const { generateRequestCode } = await import("../utils/idGenerator");
      const requestCode = generateRequestCode();
      const payload = { ...data, resolvedSalesPersonId, resolvedBranchId };
      const newReq = await tx.request.create({
        data: {
          requestCode,
          requestType: RequestType.NEW_SERVICE,
          reason: `New client registration for ${data.companyName || data.name} (${data.serviceName})`,
          status: "PENDING",
          requesterId: user.userId,
          requestedChanges: payload as any,
        },
      });
      // Return a pseudo-client object to satisfy the controller
      return { id: newReq.id, ...data, approvalStatus: ApprovalStatus.PENDING_APPROVAL, stage: "ONBOARDING" };
    }

    return await createActiveClientCore(tx, data, resolvedSalesPersonId, resolvedBranchId || "", initialApprovalStatus, branchCode);
  },
  {
    maxWait: 15000,
    timeout: 30000,
  });

  const message = newClient.approvalStatus === "PENDING_APPROVAL"
    ? "Registration request submitted for manager approval."
    : "Client registered successfully and login account provisioned.";

  invalidateClientCache();
  return {
    success: true,
    statusCode: 201,
    message: message,
    data: newClient,
  };
}

export async function createActiveClientCore(
  tx: any,
  data: any,
  resolvedSalesPersonId: string,
  resolvedBranchId: string,
  initialApprovalStatus: string,
  branchCode: string = "WZ"
) {
  const appId = generateAppId(branchCode);
  const schemeCode = generateSchemeCode();

  const existingUser = await tx.user.findFirst({
    where: { email: data.email, isDeleted: false },
  });

  if (!existingUser) {
    const defaultPasswordHash = "$2a$10$JG0jmgWyjXbhIdYVr02KM.x7lAdO6IWTB9ca5PYDtOdZCVtrHfD/."; // Pre-hashed "password123" to avoid blocking event loop
    await tx.user.create({
      data: {
        email: data.email,
        passwordHash: defaultPasswordHash,
        fullName: `${data.contactPerson} (${data.companyName})`,
        phone: data.phone,
        role: Role.CLIENT,
        branchId: resolvedBranchId,
      },
    });
  }

  const existingClient = await tx.client.findFirst({
    where: { email: data.email, serviceName: data.serviceName, isDeleted: false },
  });

  if (existingClient) {
    const updated = await tx.client.update({
      where: { id: existingClient.id },
      data: {
        approvalStatus: initialApprovalStatus,
        salesPersonId: resolvedSalesPersonId,
        branchId: resolvedBranchId,
      },
    });
    return updated;
  }

  const primaryClientForEmail = await tx.client.findFirst({
    where: { email: data.email, isDeleted: false },
    select: { documentStatus: true, companyName: true, contactPerson: true, phone: true, address: true, fundingRequirement: true },
  });

  const effectiveDocStatus = primaryClientForEmail?.documentStatus || DocumentStatus.NOT_SUBMITTED;

  const isSecondary = !!primaryClientForEmail || data.isPrimary === false || data.processType === "secondary";
  const initialCompletedSteps = isSecondary ? ["CRM Creation", "Agreement", "Reports"] : ["CRM Creation"];
  const initialProgress = isSecondary ? 60 : 20;
  const initialAppStatus = isSecondary ? "Reports" : "CRM Creation";

  const client = await tx.client.create({
    data: {
      appId,
      companyName: primaryClientForEmail?.companyName || data.companyName || data.name,
      contactPerson: primaryClientForEmail?.contactPerson || data.contactPerson || data.name,
      name: primaryClientForEmail?.companyName || data.companyName || data.name,
      email: data.email,
      phone: primaryClientForEmail?.phone || data.phone || "+91 98765 43210",
      address: primaryClientForEmail?.address || data.address,
      serviceType: data.serviceType,
      serviceName: data.serviceName,
      stage: Stage.ACTIVE,
      applicationStatus: initialAppStatus,
      progressPercent: initialProgress,
      completedSteps: initialCompletedSteps,
      adminNotes: data.adminNotes,
      branchId: resolvedBranchId,
      salesPersonId: resolvedSalesPersonId,
      originalSalesPersonId: resolvedSalesPersonId,
      approvalStatus: initialApprovalStatus,
      documentStatus: effectiveDocStatus,
      totalPayment: data.amount,
      paymentReceived: data.paymentReceived,
      fundingRequirement: data.fundingRequirement ?? primaryClientForEmail?.fundingRequirement ?? 1000000,
      schemes: {
        create: {
          schemeCode,
          serviceType: data.serviceType,
          serviceName: data.serviceName,
          stage: Stage.ACTIVE,
          applicationStatus: initialAppStatus,
          progressPercent: initialProgress,
          completedSteps: initialCompletedSteps,
          pitchedAmount: data.amount,
          receivedAmount: data.paymentReceived,
          isPrimary: !isSecondary,
        },
      },
    },
    include: {
      schemes: true,
    },
  });

  return client;
}



export async function onboardClientProfileService(user: AuthenticatedUser, data: OnboardProfileInput) {
  const client = await prisma.client.findFirst({
    where: { email: user.email, isDeleted: false },
  });

  if (!client) {
    return {
      success: false,
      statusCode: 404,
      message: "Client profile not found in database. The client must be registered and approved by a Sales Manager before submitting documents.",
    };
  }

  const compName = data.companyName || client.companyName || client.name;
  const repName = data.representativeName || client.representativeName || client.contactPerson;
  const phoneNo = data.contactNumber || data.phone || client.contactNumber || client.phone;

  const updatedClient = await prisma.client.update({
    where: { id: client.id },
    data: {
      companyName: compName,
      name: compName,
      contactPerson: repName,
      phone: phoneNo,
      address: data.address || client.address,
      businessType: data.businessType || client.businessType,
      sector: data.sector || client.sector,
      companyAge: data.companyAge || client.companyAge,
      annualTurnover: data.annualTurnover ?? client.annualTurnover,
      fundingRequirement: data.fundingRequirement ?? client.fundingRequirement,
      companyDescription: data.companyDescription ?? client.companyDescription,
      fundingPurpose: data.fundingPurpose ?? client.fundingPurpose,
      gstNumber: data.gstNumber ?? client.gstNumber,
      aadharNumber: data.aadharNumber ?? client.aadharNumber,
      panNumber: data.panNumber ?? client.panNumber,
      msmeNumber: data.msmeNumber ?? client.msmeNumber,
      companyPan: data.companyPan ?? client.companyPan,
      tanNumber: data.tanNumber ?? client.tanNumber,
      cinNumber: data.cinNumber ?? client.cinNumber,
      twelveARegNumber: data.twelveARegNumber ?? client.twelveARegNumber,
      eightyGCertNumber: data.eightyGCertNumber ?? client.eightyGCertNumber,
      darpanId: data.darpanId ?? client.darpanId,
      representativeName: repName,
      contactNumber: phoneNo,
      documentStatus: DocumentStatus.SUBMITTED,
    },
  });

  await prisma.client.updateMany({
    where: { email: user.email, isDeleted: false },
    data: {
      documentStatus: DocumentStatus.SUBMITTED,
    },
  });

  return {
    success: true,
    statusCode: 200,
    message: "Client profile saved successfully.",
    data: updatedClient,
  };
}

export async function getMyProfileService(user: AuthenticatedUser) {
  const clients = await prisma.client.findMany({
    where: { email: user.email, isDeleted: false },
    orderBy: { createdAt: "asc" },
    include: {
      invoices: { where: { isDeleted: false } },
      documents: { where: { isDeleted: false } },
      branch: true,
      salesPerson: { select: { id: true, fullName: true, email: true } },
      schemes: { where: { isDeleted: false } },
    },
  });

  if (!clients || clients.length === 0) {
    return { success: false, statusCode: 404, message: "Client profile not found." };
  }

  const client = clients[0];
  const isSubmittedOrVerified = clients.some(
    (c) => c.documentStatus === DocumentStatus.SUBMITTED || c.documentStatus === DocumentStatus.VERIFIED
  );
  const hasVerified = clients.some((c) => c.documentStatus === DocumentStatus.VERIFIED);
  const effectiveDocStatus = hasVerified
    ? DocumentStatus.VERIFIED
    : isSubmittedOrVerified
      ? DocumentStatus.SUBMITTED
      : client.documentStatus;
  const hasActive = clients.some((c) => c.approvalStatus === ApprovalStatus.ACTIVE);
  const effectiveApprovalStatus = hasActive ? ApprovalStatus.ACTIVE : client.approvalStatus;
  const totalLoan = clients.reduce((acc, c) => {
    const amt = c.fundingRequirement ? Number(c.fundingRequirement) : 0;
    return acc + amt;
  }, 0);

  const resolvedEligibleSchemes = clients.find(
    (c) => c.eligibleSchemes && Array.isArray(c.eligibleSchemes) && (c.eligibleSchemes as any).length > 0
  )?.eligibleSchemes || client.eligibleSchemes || [];

  const resolvedDueDate = clients.find((c) => c.dueDate)?.dueDate || client.dueDate || null;

  return {
    success: true,
    statusCode: 200,
    data: {
      ...client,
      eligibleSchemes: resolvedEligibleSchemes,
      dueDate: resolvedDueDate,
      computedTotalLoan: totalLoan,
      documentStatus: effectiveDocStatus,
      approvalStatus: effectiveApprovalStatus,
      allServices: clients.map((c) => {
        const reqAmt = c.fundingRequirement ? Number(c.fundingRequirement) : 0;
        const reqStr = `₹${reqAmt.toLocaleString("en-IN")}`;
        return {
          id: c.id,
          name: c.serviceName,
          schemeName: c.serviceName,
          tag: c.serviceType === "CERTIFICATE" ? "Certificate" : c.serviceType === "CONSULTANCY" ? "Consultancy Services" : "Service",
          cover: reqStr,
          fundingRequirement: reqAmt,
          amountRequired: reqAmt,
          status: c.approvalStatus === "ACTIVE" ? "Active" : "Pending",
          enrollmentDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Recently Approved",
          detail: `Approved scheme (${c.serviceName}) active in client profile.`,
          // Milestone progress — used by client portal milestone tracker
          completedSteps: c.completedSteps || ["CRM Creation"],
          progressPercent: c.progressPercent ?? 20,
          applicationStatus: c.applicationStatus || "CRM Creation",
          isPrimary: (c as any).isPrimary !== false,
        };
      }),
    },
  };
}

export async function updateClientStatusService(clientId: string, data: UpdateClientStatusInput) {
  const updatedClient = await prisma.client.update({
    where: { id: clientId },
    data: {
      completedSteps: data.completedSteps,
      applicationStatus: data.applicationStatus,
      progressPercent: data.progressPercent,
      adminNotes: data.adminNotes,
    },
  });

  // Also sync primary ClientScheme record
  await prisma.clientScheme.updateMany({
    where: { clientId: clientId, isDeleted: false },
    data: {
      completedSteps: data.completedSteps,
      applicationStatus: data.applicationStatus,
      progressPercent: data.progressPercent,
    },
  });

  invalidateClientCache();
  broadcastSseEvent({
    type: "MILESTONE_UPDATED",
    payload: {
      clientId: updatedClient.id,
      clientName: updatedClient.name,
      companyName: updatedClient.companyName,
      salesPersonId: updatedClient.salesPersonId,
      branchId: updatedClient.branchId,
      completedSteps: updatedClient.completedSteps,
      applicationStatus: updatedClient.applicationStatus,
      progressPercent: updatedClient.progressPercent,
      adminNotes: updatedClient.adminNotes,
    },
  });

  return {
    success: true,
    statusCode: 200,
    message: "Client status updated successfully.",
    data: updatedClient,
  };
}

export async function updateClientService(clientId: string, data: UpdateClientInput) {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.companyName !== undefined) updateData.companyName = data.companyName;
  if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.serviceType !== undefined) updateData.serviceType = data.serviceType;
  if (data.serviceName !== undefined) updateData.serviceName = data.serviceName;
  if (data.totalPayment !== undefined) updateData.totalPayment = data.totalPayment;
  if (data.paymentReceived !== undefined) updateData.paymentReceived = data.paymentReceived;
  if (data.completedSteps !== undefined) updateData.completedSteps = data.completedSteps;
  if (data.applicationStatus !== undefined) updateData.applicationStatus = data.applicationStatus;
  if (data.progressPercent !== undefined) updateData.progressPercent = data.progressPercent;
  if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;

  const updatedClient = await prisma.client.update({
    where: { id: clientId },
    data: updateData,
  });

  // Sync associated primary ClientScheme record
  const schemeUpdate: any = {};
  if (data.completedSteps !== undefined) schemeUpdate.completedSteps = data.completedSteps;
  if (data.applicationStatus !== undefined) schemeUpdate.applicationStatus = data.applicationStatus;
  if (data.progressPercent !== undefined) schemeUpdate.progressPercent = data.progressPercent;
  if (data.serviceName !== undefined) schemeUpdate.serviceName = data.serviceName;
  if (data.serviceType !== undefined) schemeUpdate.serviceType = data.serviceType;
  if (data.totalPayment !== undefined) schemeUpdate.pitchedAmount = data.totalPayment;
  if (data.paymentReceived !== undefined) schemeUpdate.receivedAmount = data.paymentReceived;

  if (Object.keys(schemeUpdate).length > 0) {
    await prisma.clientScheme.updateMany({
      where: { clientId: clientId, isDeleted: false },
      data: schemeUpdate,
    });
  }

  invalidateClientCache();
  broadcastSseEvent({
    type: "CLIENT_UPDATED",
    payload: {
      clientId: updatedClient.id,
      clientName: updatedClient.name,
      companyName: updatedClient.companyName,
      salesPersonId: updatedClient.salesPersonId,
      branchId: updatedClient.branchId,
      applicationStatus: updatedClient.applicationStatus,
      progressPercent: updatedClient.progressPercent,
      totalPayment: updatedClient.totalPayment,
      paymentReceived: updatedClient.paymentReceived,
    },
  });

  return {
    success: true,
    statusCode: 200,
    message: "Client updated successfully.",
    data: updatedClient,
  };
}

export async function updateDocumentStatusService(clientId: string, documentStatus: DocumentStatus) {
  const updatedClient = await prisma.client.update({
    where: { id: clientId },
    data: {
      documentStatus,
    },
  });

  return {
    success: true,
    statusCode: 200,
    message: "Document status updated successfully.",
    data: updatedClient,
  };
}
export async function verifyClientDocumentService(clientId: string, data: { documentName: string, status: string, documentNumber?: string }) {
  const existingDoc = await prisma.clientDocument.findFirst({
    where: { clientId, documentName: data.documentName, isDeleted: false }
  });

  let documentRecord;
  if (existingDoc) {
    documentRecord = await prisma.clientDocument.update({
      where: { id: existingDoc.id },
      data: { verificationStatus: data.status, documentNumber: data.documentNumber || existingDoc.documentNumber }
    });
  } else {
    documentRecord = await prisma.clientDocument.create({
      data: {
        clientId,
        documentName: data.documentName,
        verificationStatus: data.status,
        documentNumber: data.documentNumber,
        fileUrl: "" // Will be updated if a file is uploaded
      }
    });
  }

  return {
    success: true,
    statusCode: 200,
    message: "Document verification saved.",
    data: documentRecord,
  };
}
/**
 * Soft delete client record
 */
export async function deleteClientService(clientId: string, user?: AuthenticatedUser, reason?: string) {
  const existingClient = await prisma.client.findUnique({
    where: { id: clientId },
    select: { salesPersonId: true, email: true },
  });

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: user?.userId || null,
      deleteReason: reason || "Direct deletion by authorized user",
      lastSalesPersonId: existingClient?.salesPersonId || null,
    },
  });

  if (updated?.email) {
    const remaining = await prisma.client.count({
      where: { email: updated.email, isDeleted: false },
    });

    if (remaining === 0) {
      await prisma.user.updateMany({
        where: { email: updated.email, role: "CLIENT" },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    }
  }

  invalidateClientCache();
  return {
    success: true,
    statusCode: 200,
    message: "Client soft deleted successfully.",
    data: updated,
  };
}

export async function updateClientEligibleSchemesService(clientId: string, schemes: any) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    return {
      success: false,
      statusCode: 404,
      message: "Client not found.",
    };
  }

  // Update across all client records sharing this email (primary and secondary)
  await prisma.client.updateMany({
    where: {
      email: { equals: client.email, mode: "insensitive" },
      isDeleted: false,
    },
    data: {
      eligibleSchemes: schemes,
    },
  });

  invalidateClientCache();
  return {
    success: true,
    statusCode: 200,
    message: "Eligible schemes updated successfully.",
    data: schemes,
  };
}

export async function updateClientDueDateService(clientId: string, dueDate: string | null) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    return {
      success: false,
      statusCode: 404,
      message: "Client not found.",
    };
  }

  const parsedDate = dueDate ? new Date(dueDate) : null;

  // Update across all client records sharing this email (primary and secondary)
  await prisma.client.updateMany({
    where: {
      email: { equals: client.email, mode: "insensitive" },
      isDeleted: false,
    },
    data: {
      dueDate: parsedDate,
    },
  });

  invalidateClientCache();
  return {
    success: true,
    statusCode: 200,
    message: "Due date updated successfully.",
    data: { dueDate: parsedDate },
  };
}

export async function restoreClientService(clientId: string, user: AuthenticatedUser) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    return {
      success: false,
      statusCode: 404,
      message: "Client not found.",
    };
  }

  // Restore client and reset delete audit fields
  const restored = await prisma.client.update({
    where: { id: clientId },
    data: {
      isDeleted: false,
      deletedAt: null,
      deletedById: null,
      deleteReason: null,
    },
    include: {
      branch: true,
      salesPerson: { select: { id: true, fullName: true, email: true } },
    },
  });

  // Restore client user login account if applicable
  if (restored.email) {
    await prisma.user.updateMany({
      where: { email: restored.email, role: Role.CLIENT },
      data: { isDeleted: false, deletedAt: null },
    });
  }

  invalidateClientCache();
  return {
    success: true,
    statusCode: 200,
    message: "Client restored successfully.",
    data: restored,
  };
}


