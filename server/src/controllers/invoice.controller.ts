import { Response, NextFunction } from "express";
import { z } from "zod";
import { InvoiceType, PaymentMode } from "@prisma/client";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  getInvoicesService,
  createInvoiceService,
  getPaymentsService,
  addPaymentService,
} from "../services/invoice.service";

const createInvoiceSchema = z.object({
  // Accept any non-empty string (UUID or legacy email-based IDs)
  clientId: z.string().min(1, "Client ID is required"),
  invoiceType: z.nativeEnum(InvoiceType).optional(),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().optional(), // Optional: proforma invoices may not have a due date
  paymentMode: z.nativeEnum(PaymentMode),
  rawAmount: z.number().nonnegative("Base amount cannot be negative"),
  gstRate: z.number().nonnegative(),
  gstAmount: z.number().nonnegative(),
  rawTotal: z.number().nonnegative(),
  gstNo: z.string().optional(),
  description: z.string().optional(),
  hsnSac: z.string().optional(),
  placeOfSupply: z.string().optional(),
  quantity: z.number().int().positive().optional(),
});

const createPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be positive"),
  paymentMode: z.nativeEnum(PaymentMode),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
  paymentDate: z.string().optional(),
});

export async function getInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const result = await getInvoicesService(user);
    res.status(result.statusCode).json(result.data);
  } catch (error) {
    next(error);
  }
}

export async function createInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = createInvoiceSchema.parse(req.body);
    const user = req.user!;
    const result = await createInvoiceService(user, data);
    if (!result.success) {
      res.status(result.statusCode).json({ message: result.message });
      return;
    }
    res.status(result.statusCode).json(result.data);
  } catch (error) {
    next(error);
  }
}

export async function getPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const result = await getPaymentsService(user);
    res.status(result.statusCode).json(result.data);
  } catch (error) {
    next(error);
  }
}

export async function addPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const invoiceId = req.params.id as string;
    const data = createPaymentSchema.parse(req.body);
    const user = req.user!;
    const result = await addPaymentService(user, invoiceId, data);
    if (!result.success) {
      res.status(result.statusCode).json({ message: result.message });
      return;
    }
    res.status(result.statusCode).json(result.data);
  } catch (error) {
    next(error);
  }
}

const createPaymentRequestSchema = z.object({
  clientId: z.string().optional(),
  clientEmail: z.string().optional(),
  clientName: z.string().optional(),
  companyName: z.string().optional(),
  amount: z.number().positive("Requested amount must be positive"),
  paymentId: z.string().optional(),
  paymentMode: z.nativeEnum(PaymentMode).optional(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
});

const settlePaymentDemandSchema = z.object({
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
});

export async function createPaymentRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = createPaymentRequestSchema.parse(req.body);
    const user = req.user!;
    const { createPaymentRequestService } = await import("../services/invoice.service");
    const result = await createPaymentRequestService(user, data);
    if (!result.success) {
      res.status(result.statusCode).json({ message: result.message });
      return;
    }
    res.status(result.statusCode).json(result.data);
  } catch (error) {
    next(error);
  }
}

export async function settlePaymentDemand(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const paymentId = req.params.id as string;
    const data = settlePaymentDemandSchema.parse(req.body || {});
    const user = req.user!;
    const { settlePaymentDemandService } = await import("../services/invoice.service");
    const result = await settlePaymentDemandService(user, paymentId, data);
    if (!result.success) {
      res.status(result.statusCode).json({ message: result.message });
      return;
    }
    res.status(result.statusCode).json(result.data);
  } catch (error) {
    next(error);
  }
}

export async function markPaymentPaid(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const paymentId = req.params.id as string;
    const user = req.user!;
    const { markPaymentPaidService } = await import("../services/invoice.service");
    const result = await markPaymentPaidService(user, paymentId);
    if (!result.success) {
      res.status(result.statusCode).json({ message: result.message });
      return;
    }
    res.status(result.statusCode).json(result.data);
  } catch (error) {
    next(error);
  }
}

const verifyRazorpaySchema = z.object({
  razorpay_payment_id: z.string().min(1, "Razorpay Payment ID is required"),
  razorpay_order_id: z.string().min(1, "Razorpay Order ID is required"),
  razorpay_signature: z.string().min(1, "Razorpay Signature is required"),
});

export async function createRazorpayOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const paymentId = req.params.id as string;
    const user = req.user!;
    const { createRazorpayOrderService } = await import("../services/invoice.service");
    const result = await createRazorpayOrderService(user, paymentId);
    if (!result.success || !("data" in result)) {
      res.status(result.statusCode).json({ message: result.message });
      return;
    }
    res.status(result.statusCode).json(result.data);
  } catch (error) {
    next(error);
  }
}

export async function verifyRazorpayPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const paymentId = req.params.id as string;
    const data = verifyRazorpaySchema.parse(req.body);
    const user = req.user!;
    const { verifyRazorpayPaymentService } = await import("../services/invoice.service");
    const result = await verifyRazorpayPaymentService(user, paymentId, data);
    if (!result.success || !("data" in result)) {
      res.status(result.statusCode).json({ message: result.message });
      return;
    }
    res.status(result.statusCode).json(result.data);
  } catch (error) {
    next(error);
  }
}


