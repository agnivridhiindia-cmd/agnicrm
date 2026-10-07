import { InvoiceType, PaymentMode, PaymentStatus, Role, TransactionStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AuthenticatedUser } from "../middlewares/auth.middleware";
import { generateInvoiceNo, generatePaymentId } from "../utils/idGenerator";

export interface CreateInvoiceInput {
  clientId: string;
  invoiceType?: InvoiceType; // PROFORMA for pending, TAX for fully paid
  issueDate: string;
  dueDate?: string; // Optional — proforma may not have a due date
  paymentMode: PaymentMode;
  rawAmount: number;
  gstRate: number;
  gstAmount: number;
  rawTotal: number;
  gstNo?: string;
  description?: string;
  hsnSac?: string;
  placeOfSupply?: string;
  quantity?: number;
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
        select: {
          id: true,
          name: true,
          companyName: true,
          email: true,
          phone: true,
          address: true,
          gstNumber: true,
          panNumber: true,
          companyPan: true,
          contactPerson: true,
          representativeName: true,
          contactNumber: true,
        },
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
  // Try to find client by UUID id first; fall back to email lookup for legacy clients
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.clientId);
  let client = null;
  if (isUuid) {
    client = await prisma.client.findFirst({ where: { id: data.clientId, isDeleted: false } });
  }
  // Fallback: try email lookup (for legacy/mock clients that use email as id)
  if (!client) {
    client = await prisma.client.findFirst({ where: { email: data.clientId, isDeleted: false } });
  }
  if (!client) {
    return { success: false, statusCode: 404, message: "Client not found" };
  }

  // Count invoices created today for daily sequence: INV-dd/mm/yyyy-00number
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const todayCount = await prisma.invoice.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  let seq = todayCount + 1;
  let invoiceNo = generateInvoiceNo(seq, now);
  while (await prisma.invoice.findUnique({ where: { invoiceNo } })) {
    seq++;
    invoiceNo = generateInvoiceNo(seq, now);
  }

  // Check if client has already made payments or if this is a Tax Invoice for paid fees
  const clientAlreadyPaid = Number(client.paymentReceived || 0);
  const existingInvoices = await prisma.invoice.findMany({
    where: { clientId: client.id, isDeleted: false },
    select: { paymentReceived: true },
  });
  const alreadyInvoicedPaid = existingInvoices.reduce((sum, inv) => sum + Number(inv.paymentReceived || 0), 0);
  const unallocatedClientPayment = Math.max(0, clientAlreadyPaid - alreadyInvoicedPaid);

  const isTaxType = data.invoiceType === InvoiceType.TAX;
  const initialReceived = isTaxType
    ? Math.min(data.rawTotal, Math.max(unallocatedClientPayment, data.rawTotal))
    : Math.min(data.rawTotal, unallocatedClientPayment);
  const initialPending = Math.max(0, data.rawTotal - initialReceived);
  const initialStatus = initialPending === 0 && initialReceived > 0
    ? PaymentStatus.PAID
    : (initialReceived > 0 ? PaymentStatus.PARTIAL : PaymentStatus.PENDING);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo,
      invoiceType: data.invoiceType ?? (initialStatus === PaymentStatus.PAID ? InvoiceType.TAX : InvoiceType.PROFORMA),
      issueDate: new Date(data.issueDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      paymentMode: data.paymentMode,
      rawAmount: data.rawAmount,
      gstRate: data.gstRate,
      gstAmount: data.gstAmount,
      rawTotal: data.rawTotal,
      paymentReceived: initialReceived,
      paymentPending: initialPending,
      status: initialStatus,
      gstNo: data.gstNo,
      description: data.description,
      hsnSac: data.hsnSac,
      placeOfSupply: data.placeOfSupply,
      quantity: data.quantity ?? 1,
      clientId: client.id,
      branchId: client.branchId,
      accountManagerId: client.salesPersonId,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
          email: true,
          phone: true,
          address: true,
          gstNumber: true,
          panNumber: true,
          companyPan: true,
          contactPerson: true,
          representativeName: true,
          contactNumber: true,
        },
      },
      payments: true,
    },
  });

  if (initialReceived > 0) {
    const paymentId = generatePaymentId();
    await prisma.payment.create({
      data: {
        paymentId,
        amount: initialReceived,
        paymentMode: data.paymentMode,
        status: TransactionStatus.SUCCESS,
        clientId: client.id,
        invoiceId: invoice.id,
        recordedById: user.userId,
        remarks: "Payment collected upon client registration / invoice generation",
      },
    });
  }

  return { success: true, statusCode: 201, data: invoice };
}

export interface CreatePaymentRequestInput {
  clientId?: string;
  clientEmail?: string;
  clientName?: string;
  companyName?: string;
  amount: number;
  paymentId?: string;
  paymentMode?: PaymentMode;
  dueDate?: string;
  description?: string;
}

export async function getPaymentsService(user: AuthenticatedUser) {
  let whereClause: any = { isDeleted: false };

  if (user.role === Role.SALES_PERSON) {
    whereClause = {
      isDeleted: false,
      OR: [
        { recordedById: user.userId },
        { recordedBy: { email: { equals: user.email, mode: "insensitive" } } },
        { client: { salesPersonId: user.userId, isDeleted: false } },
        { client: { salesPerson: { email: { equals: user.email, mode: "insensitive" } }, isDeleted: false } },
      ],
    };
  } else if (user.role === Role.BRANCH_MANAGER) {
    whereClause = {
      isDeleted: false,
      OR: [
        { client: { branchId: user.branchId, isDeleted: false } },
        { invoice: { branchId: user.branchId, isDeleted: false } },
      ],
    };
  } else if (user.role === Role.CLIENT) {
    whereClause = {
      isDeleted: false,
      client: {
        email: { equals: user.email, mode: "insensitive" },
        isDeleted: false,
      },
    };
  }

  const payments = await prisma.payment.findMany({
    where: whereClause,
    include: {
      invoice: { select: { id: true, invoiceNo: true, rawTotal: true, dueDate: true, paymentPending: true } },
      client: { select: { id: true, name: true, companyName: true, email: true, phone: true } },
      recordedBy: { select: { id: true, fullName: true, role: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, statusCode: 200, data: payments };
}

export async function createPaymentRequestService(user: AuthenticatedUser, data: CreatePaymentRequestInput) {
  const emailToFind = (data.clientEmail || (data.clientId && data.clientId.includes("@") ? data.clientId : "")).toLowerCase().trim();
  const nameToFind = (data.companyName || data.clientName || "").trim();
  const idToFind = data.clientId || "";

  // 1. Try finding by UUID/ID, email, or companyName/name
  let client = await prisma.client.findFirst({
    where: {
      OR: [
        ...(idToFind ? [{ id: idToFind }] : []),
        ...(emailToFind ? [{ email: { equals: emailToFind, mode: "insensitive" as const } }] : []),
        ...(nameToFind ? [
          { companyName: { equals: nameToFind, mode: "insensitive" as const } },
          { name: { equals: nameToFind, mode: "insensitive" as const } },
        ] : []),
      ],
      isDeleted: false,
    },
    include: { invoices: { where: { isDeleted: false }, orderBy: { createdAt: "desc" } } },
  });

  // 2. If not found, try finding by contains name/company or email
  if (!client && (nameToFind || emailToFind)) {
    client = await prisma.client.findFirst({
      where: {
        OR: [
          ...(emailToFind ? [{ email: { contains: emailToFind, mode: "insensitive" as const } }] : []),
          ...(nameToFind ? [
            { companyName: { contains: nameToFind, mode: "insensitive" as const } },
            { name: { contains: nameToFind, mode: "insensitive" as const } },
          ] : []),
        ],
        isDeleted: false,
      },
      include: { invoices: { where: { isDeleted: false }, orderBy: { createdAt: "desc" } } },
    });
  }

  // 3. Fallback: If still not found, check if ANY client matches for this salesperson
  if (!client && user.role === Role.SALES_PERSON) {
    client = await prisma.client.findFirst({
      where: { salesPersonId: user.userId, isDeleted: false },
      include: { invoices: { where: { isDeleted: false }, orderBy: { createdAt: "desc" } } },
    });
  }

  if (!client) {
    return { success: false, statusCode: 404, message: "Client not found" };
  }

  // Find or create an invoice for this client
  let invoice = client.invoices.find((inv) => inv.status !== PaymentStatus.PAID) || client.invoices[0];

  // Ensure recordedBy and accountManager reference valid users in PostgreSQL
  let recordedById = user.userId;
  const userExists = await prisma.user.findUnique({ where: { id: recordedById }, select: { id: true } });
  if (!userExists) {
    if (client.salesPersonId) {
      const spExists = await prisma.user.findUnique({ where: { id: client.salesPersonId }, select: { id: true } });
      if (spExists) recordedById = client.salesPersonId;
    }
    if (!userExists && recordedById === user.userId) {
      const anyStaff = await prisma.user.findFirst({ select: { id: true } });
      if (anyStaff) recordedById = anyStaff.id;
    }
  }

  if (!invoice) {
    const now = new Date();
    const count = await prisma.invoice.count();
    let seq = count + 1;
    let invoiceNo = generateInvoiceNo(seq, now);
    while (await prisma.invoice.findUnique({ where: { invoiceNo } })) {
      seq++;
      invoiceNo = generateInvoiceNo(seq, now);
    }

    invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        invoiceType: InvoiceType.PROFORMA,
        issueDate: new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        paymentMode: data.paymentMode || PaymentMode.ONLINE,
        rawAmount: data.amount,
        gstRate: data.paymentMode === PaymentMode.OFFLINE ? 0 : 0.18,
        gstAmount: 0,
        rawTotal: data.amount,
        paymentReceived: 0,
        paymentPending: data.amount,
        status: PaymentStatus.PENDING,
        description: data.description || `Service retainer for ${client.companyName || client.name}`,
        clientId: client.id,
        branchId: client.branchId,
        accountManagerId: client.salesPersonId || (userExists ? user.userId : undefined),
      },
    });
  }

  const paymentId = data.paymentId || generatePaymentId();

  // If already exists, return existing
  const existingPay = await prisma.payment.findUnique({
    where: { paymentId },
    include: {
      invoice: { select: { id: true, invoiceNo: true, rawTotal: true, dueDate: true, paymentPending: true } },
      client: { select: { id: true, name: true, companyName: true, email: true, phone: true } },
      recordedBy: { select: { id: true, fullName: true, role: true, email: true } },
    },
  });
  if (existingPay) {
    return { success: true, statusCode: 200, data: existingPay };
  }

  const payment = await prisma.payment.create({
    data: {
      paymentId,
      amount: data.amount,
      paymentDate: new Date(),
      paymentMode: data.paymentMode || PaymentMode.ONLINE,
      status: TransactionStatus.PENDING,
      remarks: data.description ? `PAYMENT_REQUEST: ${data.description}` : "PAYMENT_REQUEST",
      invoiceId: invoice.id,
      clientId: client.id,
      recordedById,
    },
    include: {
      invoice: { select: { id: true, invoiceNo: true, rawTotal: true, dueDate: true, paymentPending: true } },
      client: { select: { id: true, name: true, companyName: true, email: true, phone: true } },
      recordedBy: { select: { id: true, fullName: true, role: true, email: true } },
    },
  });

  return { success: true, statusCode: 201, data: payment };
}

export async function settlePaymentDemandService(
  user: AuthenticatedUser,
  paymentIdOrId: string,
  data: { referenceNumber?: string; remarks?: string }
) {
  const cleanId = paymentIdOrId.replace(/^SETTLE-/, "");
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { id: paymentIdOrId },
        { paymentId: paymentIdOrId },
        { paymentId: cleanId },
      ],
      isDeleted: false,
    },
  });

  if (!payment) {
    return { success: false, statusCode: 404, message: "Payment request not found" };
  }

  const txnRef = data.referenceNumber || `TXN-AGNI-${Date.now().toString().slice(-6)}`;
  const remarkText = data.remarks ? `AWAITING_APPROVAL: ${data.remarks}` : "AWAITING_APPROVAL: Settle proof submitted by client";

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      referenceNumber: txnRef,
      remarks: remarkText,
      updatedAt: new Date(),
    },
    include: {
      invoice: { select: { id: true, invoiceNo: true, rawTotal: true, dueDate: true, paymentPending: true } },
      client: { select: { id: true, name: true, companyName: true, email: true, phone: true } },
      recordedBy: { select: { id: true, fullName: true, role: true, email: true } },
    },
  });

  return { success: true, statusCode: 200, data: updatedPayment };
}

export async function markPaymentPaidService(
  user: AuthenticatedUser,
  paymentIdOrId: string
) {
  return await prisma.$transaction(async (tx) => {
    const cleanId = paymentIdOrId.replace(/^SETTLE-/, "");
    const payment = await tx.payment.findFirst({
      where: {
        OR: [
          { id: paymentIdOrId },
          { paymentId: paymentIdOrId },
          { paymentId: cleanId },
        ],
        isDeleted: false,
      },
      include: {
        invoice: true,
        client: true,
      },
    });

    if (!payment) {
      return { success: false, statusCode: 404, message: "Payment record not found" };
    }

    if (payment.status === TransactionStatus.SUCCESS) {
      return { success: true, statusCode: 200, data: { payment, message: "Already marked as paid" } };
    }

    const payAmount = Number(payment.amount);

    // 1. Update Payment status to SUCCESS
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: TransactionStatus.SUCCESS,
        remarks: payment.remarks
          ? `${payment.remarks.replace(/^AWAITING_APPROVAL:\s*/, "")} (Verified & Marked Paid)`
          : "Verified & Marked Paid",
        updatedAt: new Date(),
      },
      include: {
        invoice: { select: { id: true, invoiceNo: true, rawTotal: true, dueDate: true, paymentPending: true } },
        client: { select: { id: true, name: true, companyName: true, email: true, phone: true } },
        recordedBy: { select: { id: true, fullName: true, role: true, email: true } },
      },
    });

    // 2. Update Invoice
    let finalInvoice = payment.invoice;
    if (payment.invoiceId) {
      const updatedInvoice = await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paymentReceived: { increment: payAmount },
          paymentPending: { decrement: payAmount },
        },
      });

      const updatedPending = Number(updatedInvoice.paymentPending);
      let newStatus = updatedInvoice.status;
      if (updatedPending <= 0) {
        newStatus = PaymentStatus.PAID;
      } else {
        newStatus = PaymentStatus.PARTIAL;
      }

      finalInvoice = await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          status: newStatus,
          ...(newStatus === PaymentStatus.PAID ? { invoiceType: InvoiceType.TAX } : {}),
        },
      });
    }

    // 3. Update Client balances
    if (payment.clientId) {
      await tx.client.update({
        where: { id: payment.clientId },
        data: {
          paymentReceived: { increment: payAmount },
          updatedAt: new Date(),
        },
      });

      await tx.clientScheme.updateMany({
        where: { clientId: payment.clientId },
        data: {
          receivedAmount: { increment: payAmount },
        },
      });
    }

    return {
      success: true,
      statusCode: 200,
      data: { payment: updatedPayment, invoice: finalInvoice },
    };
  });
}

export async function addPaymentService(user: AuthenticatedUser, invoiceId: string, data: CreatePaymentInput) {
  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: {
        OR: [
          { id: invoiceId },
          { invoiceNo: invoiceId },
        ],
        isDeleted: false,
      },
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
        data: {
          status: newStatus,
          // Business rule: when fully paid, automatically upgrade to Tax Invoice
          ...(newStatus === PaymentStatus.PAID ? { invoiceType: InvoiceType.TAX } : {}),
        },
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

    // 4. Atomically sync Client and ClientScheme balances across dashboards
    if (invoice.clientId) {
      await tx.client.update({
        where: { id: invoice.clientId },
        data: {
          paymentReceived: { increment: data.amount },
          updatedAt: new Date(),
        },
      });

      await tx.clientScheme.updateMany({
        where: { clientId: invoice.clientId },
        data: {
          receivedAmount: { increment: data.amount },
        },
      });
    }

    return {
      success: true,
      statusCode: 201,
      data: { payment, invoice: finalInvoice },
    };
  });
}
