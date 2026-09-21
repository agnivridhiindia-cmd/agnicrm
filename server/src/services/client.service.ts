import bcrypt from "bcryptjs";
import { ServiceType, Stage, PaymentMode, Role, ApprovalStatus, DocumentStatus, RequestType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AuthenticatedUser } from "../middlewares/auth.middleware";
import { generateAppId, generateSchemeCode } from "../utils/idGenerator";

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

export async function getClientsService(user: AuthenticatedUser) {
  let whereClause: any = { isDeleted: false };

  if (user.role === "SALES_PERSON") {
    whereClause.salesPersonId = user.userId;
  } else if (user.role === "BRANCH_MANAGER" || user.role === "ADMIN" || user.role === "MANAGER") {
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
  }

  const clients = await prisma.client.findMany({
    where: whereClause,
    include: {
      branch: true,
      salesPerson: { select: { id: true, fullName: true, email: true } },
      invoices: { where: { isDeleted: false }, include: { payments: { where: { isDeleted: false } } } },
      documents: { where: { isDeleted: false } },
      schemes: { where: { isDeleted: false } },
    },
    orderBy: { createdAt: "desc" },
  });

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

    return {
      ...c,
      companyName: compName,
      name: compName,
      contactPerson: contactPerson,
      applicationStatus: appStatus,
      progressPercent: progress,
      completedSteps: steps,
    };
  });

  return { success: true, count: cleanedClients.length, data: cleanedClients };
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
  });

  const message = newClient.approvalStatus === "PENDING_APPROVAL"
    ? "Registration request submitted for manager approval."
    : "Client registered successfully and login account provisioned.";

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
    const defaultPasswordHash = await bcrypt.hash("password123", 10);
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

  return {
    success: true,
    statusCode: 200,
    data: {
      ...client,
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

  return {
    success: true,
    statusCode: 200,
    message: "Client status updated successfully.",
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
export async function deleteClientService(clientId: string) {
  const updated = await prisma.client.update({
    where: { id: clientId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  return {
    success: true,
    statusCode: 200,
    message: "Client soft deleted successfully.",
    data: updated,
  };
}

