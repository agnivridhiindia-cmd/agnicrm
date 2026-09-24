import { AgreementStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AuthenticatedUser } from "../middlewares/auth.middleware";
import { generateAgreementCode } from "../utils/idGenerator";

export interface GenerateAgreementInput {
  clientId?: string;
  clientEmail?: string;
  companyName?: string;
  companyAddress?: string;
  agreementDate?: string;
  pitchedMoney?: any;
  paymentReceived?: any;
  paymentLeft?: any;
  disbursementRate?: any;
  scheme?: string;
  templateType?: string;
}

export async function getAgreementsService(user: AuthenticatedUser) {
  let whereClause: any = { isDeleted: false };

  if (user.role === "CLIENT") {
    whereClause.client = { email: user.email, isDeleted: false };
  } else if (user.role === "SALES_PERSON") {
    whereClause.client = { salesPersonId: user.userId, isDeleted: false };
  } else if (user.role === "BRANCH_MANAGER" || user.role === "MANAGER" || user.role === "ADMIN") {
    let targetBranchId = user.branchId;
    if (!targetBranchId) {
      const dbUser = await prisma.user.findFirst({
        where: { id: user.userId, isDeleted: false },
        select: { branchId: true },
      });
      targetBranchId = dbUser?.branchId || undefined;
    }
    if (targetBranchId) {
      whereClause.client = { branchId: targetBranchId, isDeleted: false };
    }
  }

  const agreements = await prisma.agreement.findMany({
    where: whereClause,
    include: {
      client: {
        include: {
          branch: true,
          salesPerson: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, statusCode: 200, count: agreements.length, data: agreements };
}

export async function getAgreementByIdService(user: AuthenticatedUser, agreementId: string) {
  const agreement = await prisma.agreement.findFirst({
    where: {
      isDeleted: false,
      OR: [{ id: agreementId }, { agreementCode: agreementId }],
    },
    include: {
      client: {
        include: {
          branch: true,
          salesPerson: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });

  if (!agreement) {
    return {
      success: false,
      statusCode: 404,
      message: `Agreement "${agreementId}" not found.`,
    };
  }

  // Authorization check to prevent IDOR
  if (user.role === "CLIENT") {
    if (agreement.client?.email?.toLowerCase() !== user.email?.toLowerCase()) {
      return {
        success: false,
        statusCode: 403,
        message: "Forbidden: You are not authorized to view this agreement.",
      };
    }
  } else if (user.role === "SALES_PERSON") {
    if (agreement.client?.salesPersonId && agreement.client.salesPersonId !== user.userId) {
      return {
        success: false,
        statusCode: 403,
        message: "Forbidden: You are not assigned to this client's agreement.",
      };
    }
  } else if (user.role === "BRANCH_MANAGER" || user.role === "MANAGER") {
    let targetBranchId = user.branchId;
    if (!targetBranchId) {
      const dbUser = await prisma.user.findFirst({
        where: { id: user.userId, isDeleted: false },
        select: { branchId: true },
      });
      targetBranchId = dbUser?.branchId || undefined;
    }
    if (targetBranchId && agreement.client?.branchId && agreement.client.branchId !== targetBranchId) {
      return {
        success: false,
        statusCode: 403,
        message: "Forbidden: This agreement belongs to another branch.",
      };
    }
  }

  return { success: true, statusCode: 200, data: agreement };
}

export async function generateAgreementService(body: GenerateAgreementInput) {
  const targetEmail = body.clientEmail || body.companyName;

  let client = null;
  if (body.clientId) {
    client = await prisma.client.findFirst({
      where: {
        isDeleted: false,
        OR: [{ id: body.clientId }, { appId: body.clientId }],
      },
    });
  }

  if (!client && targetEmail) {
    client = await prisma.client.findFirst({
      where: {
        isDeleted: false,
        OR: [{ email: targetEmail }, { companyName: targetEmail }, { name: targetEmail }],
      },
    });
  }

  if (!client) {
    client = await prisma.client.findFirst({ where: { isDeleted: false }, orderBy: { createdAt: "desc" } });
  }

  if (!client) {
    return {
      success: false,
      statusCode: 404,
      message: "No client record found to associate with agreement.",
    };
  }

  const isPrivate = (body.scheme || body.templateType || "").toLowerCase().includes("private funding");
  const templateType = isPrivate ? "PRIVATE_FUNDING" : "SCHEME";
  const templateName = isPrivate ? "Private Funding Agreement" : "Common Scheme Agreement";

  const branchCode = client.appId?.split("-")[1] || "WZ";
  const agreementCode = generateAgreementCode(branchCode);

  const numPitched = body.pitchedMoney ? parseFloat(String(body.pitchedMoney).replace(/[^0-9.]/g, "")) : 50000;
  const numReceived = body.paymentReceived ? parseFloat(String(body.paymentReceived).replace(/[^0-9.]/g, "")) : 20000;
  const numLeft = body.paymentLeft ? parseFloat(String(body.paymentLeft).replace(/[^0-9.]/g, "")) : 30000;
  const rateStr = body.disbursementRate ? String(body.disbursementRate) : "10%";

  const newAgreement = await prisma.agreement.create({
    data: {
      agreementCode,
      templateType,
      templateName,
      status: AgreementStatus.GENERATED,
      pitchedAmount: isNaN(numPitched) ? 50000 : numPitched,
      receivedAmount: isNaN(numReceived) ? 20000 : numReceived,
      leftAmount: isNaN(numLeft) ? 30000 : numLeft,
      successRate: rateStr,
      docxFileUrl: isPrivate ? "/templates/private_funding.docx" : "/templates/common_agreement.docx",
      sentToEmail: client.email,
      clientId: client.id,
    },
    include: {
      client: {
        include: {
          branch: true,
          salesPerson: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });

  return {
    success: true,
    statusCode: 201,
    message: "Agreement generated successfully.",
    data: newAgreement,
  };
}

export async function sendAgreementService(agreementId: string, recipientEmail?: string) {
  const agreement = await prisma.agreement.findFirst({
    where: {
      isDeleted: false,
      OR: [{ id: agreementId }, { agreementCode: agreementId }],
    },
    include: { client: true },
  });

  if (!agreement) {
    return {
      success: false,
      statusCode: 404,
      message: `Agreement "${agreementId}" not found.`,
    };
  }

  const targetEmail = recipientEmail || agreement.sentToEmail || agreement.client.email;

  const updated = await prisma.agreement.update({
    where: { id: agreement.id },
    data: {
      status: AgreementStatus.SENT,
      sentToEmail: targetEmail,
      sentAt: new Date(),
    },
    include: {
      client: {
        include: {
          branch: true,
          salesPerson: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });

  return {
    success: true,
    statusCode: 200,
    message: `Agreement dispatched successfully to ${targetEmail}.`,
    data: updated,
  };
}

export async function updateAgreementStatusService(agreementId: string, status: AgreementStatus) {
  const agreement = await prisma.agreement.findFirst({
    where: {
      isDeleted: false,
      OR: [{ id: agreementId }, { agreementCode: agreementId }],
    },
  });

  if (!agreement) {
    return {
      success: false,
      statusCode: 404,
      message: `Agreement "${agreementId}" not found.`,
    };
  }

  const updated = await prisma.agreement.update({
    where: { id: agreement.id },
    data: { status },
    include: { client: true },
  });

  return {
    success: true,
    statusCode: 200,
    message: `Agreement status updated to ${status}.`,
    data: updated,
  };
}
