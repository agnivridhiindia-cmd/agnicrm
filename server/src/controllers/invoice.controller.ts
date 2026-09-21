import { Response, NextFunction } from "express";
import { z } from "zod";
import { PaymentMode } from "@prisma/client";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  getInvoicesService,
  createInvoiceService,
  getPaymentsService,
  addPaymentService,
} from "../services/invoice.service";

const createInvoiceSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  issueDate: z.string(),
  dueDate: z.string(),
  paymentMode: z.nativeEnum(PaymentMode),
  rawAmount: z.number().nonnegative("Base amount cannot be negative"),
  gstRate: z.number().nonnegative(),
  gstAmount: z.number().nonnegative(),
  rawTotal: z.number().nonnegative(),
  gstNo: z.string().optional(),
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
