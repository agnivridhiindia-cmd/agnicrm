import { PaymentMode, PaymentStatus, Role, TransactionStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AuthenticatedUser } from "../middlewares/auth.middleware";
import { generateInvoiceNo, generatePaymentId } from "../utils/idGenerator";

export interface CreateInvoiceInput {
  clientId: string;
  issueDate: string;
  dueDate: string;
  paymentMode: PaymentMode;
  rawAmount: number;
  gstRate: number;
  gstAmount: number;
  rawTotal: number;
  gstNo?: string;
}

export interface CreatePaymentInput {
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  remarks?: string;
  paymentDate?: string;
}

export async function getInvoicesService(user: AuthenticatedUser) {
  let whereClause: any = { isDeleted: false };

  if (user.role === Role.SALES_PERSON) {
    whereClause.client = { salesPersonId: user.userId, isDeleted: false };
  } else if (user.role === Role.BRANCH_MANAGER) {
    whereClause.branchId = user.branchId;
  } else if (user.role === Role.CLIENT) {
    whereClause.client = { email: user.email, isDeleted: false };
  }

  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    include: {
      client: {
        select: { name: true, companyName: true, email: true, phone: true },
      },
      branch: { select: { name: true } },
      accountManager: { select: { fullName: true, email: true } },
      payments: { where: { isDeleted: false } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, statusCode: 200, data: invoices };
}

export async function createInvoiceService(user: AuthenticatedUser, data: CreateInvoiceInput) {
  const client = await prisma.client.findFirst({ where: { id: data.clientId, isDeleted: false } });
  if (!client) {
    return { success: false, statusCode: 404, message: "Client not found" };
  }

  const invoiceNo = generateInvoiceNo();

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo,
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
      paymentMode: data.paymentMode,
      rawAmount: data.rawAmount,
      gstRate: data.gstRate,
      gstAmount: data.gstAmount,
      rawTotal: data.rawTotal,
      paymentReceived: 0,
      paymentPending: data.rawTotal,
      status: PaymentStatus.PENDING,
      gstNo: data.gstNo,
      clientId: data.clientId,
      branchId: client.branchId,
      accountManagerId: client.salesPersonId,
    },
    include: {
      client: { select: { name: true, companyName: true } },
      payments: true,
    },
  });

  return { success: true, statusCode: 201, data: invoice };
}

export async function getPaymentsService(user: AuthenticatedUser) {
  let whereClause: any = { isDeleted: false };

  if (user.role === Role.SALES_PERSON) {
    whereClause.client = { salesPersonId: user.userId, isDeleted: false };
  } else if (user.role === Role.BRANCH_MANAGER) {
    whereClause.client = { branchId: user.branchId, isDeleted: false };
  } else if (user.role === Role.CLIENT) {
    whereClause.client = { email: user.email, isDeleted: false };
  }

  const payments = await prisma.payment.findMany({
    where: whereClause,
    include: {
      invoice: { select: { invoiceNo: true, rawTotal: true } },
      client: { select: { name: true, companyName: true, email: true } },
      recordedBy: { select: { fullName: true, role: true } },
    },
    orderBy: { paymentDate: "desc" },
  });

  return { success: true, statusCode: 200, data: payments };
}

export async function addPaymentService(user: AuthenticatedUser, invoiceId: string, data: CreatePaymentInput) {
  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, isDeleted: false },
      include: { client: true },
    });

    if (!invoice) {
      return { success: false, statusCode: 404, message: "Invoice not found" };
    }

    if (invoice.status === PaymentStatus.PAID) {
      return { success: false, statusCode: 400, message: "Invoice is already fully paid" };
    }

    const pendingNum = Number(invoice.paymentPending);
    if (data.amount > pendingNum) {
      return {
        success: false,
        statusCode: 400,
        message: `Payment amount (${data.amount}) exceeds pending amount (${pendingNum})`,
      };
    }

    const paymentId = generatePaymentId();

    // 1. Create Payment
    const payment = await tx.payment.create({
      data: {
        paymentId,
        amount: data.amount,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        paymentMode: data.paymentMode,
        referenceNumber: data.referenceNumber,
        remarks: data.remarks,
        status: TransactionStatus.SUCCESS,
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        recordedById: user.userId,
      },
    });

    // 2. Atomic update on Invoice using { increment, decrement } to prevent race conditions
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentReceived: { increment: data.amount },
        paymentPending: { decrement: data.amount },
      },
    });

    // 3. Status determination based on atomic updated balances
    const updatedPending = Number(updatedInvoice.paymentPending);
    const updatedReceived = Number(updatedInvoice.paymentReceived);

    let newStatus = updatedInvoice.status;
    if (updatedPending <= 0) {
      newStatus = PaymentStatus.PAID;
    } else if (updatedReceived > 0) {
      newStatus = PaymentStatus.PARTIAL;
    }

    let finalInvoice = updatedInvoice;
    if (newStatus !== updatedInvoice.status) {
      finalInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: newStatus },
        include: {
          payments: { where: { isDeleted: false } },
          client: { select: { name: true, companyName: true } },
        },
      });
    } else {
      finalInvoice = await tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          payments: { where: { isDeleted: false } },
          client: { select: { name: true, companyName: true } },
        },
      }) || updatedInvoice;
    }

    return {
      success: true,
      statusCode: 201,
      data: { payment, invoice: finalInvoice },
    };
  });
}
