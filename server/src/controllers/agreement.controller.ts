import { Response, NextFunction } from "express";
import { z } from "zod";
import { AgreementStatus } from "@prisma/client";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  getAgreementsService,
  getAgreementByIdService,
  generateAgreementService,
  sendAgreementService,
  updateAgreementStatusService,
} from "../services/agreement.service";

const generateAgreementSchema = z.object({
  clientId: z.string().optional(),
  clientEmail: z.string().email().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  agreementDate: z.string().optional(),
  pitchedMoney: z.any().optional(),
  paymentReceived: z.any().optional(),
  paymentLeft: z.any().optional(),
  disbursementRate: z.any().optional(),
  scheme: z.string().optional(),
  templateType: z.string().optional(),
});

const sendAgreementSchema = z.object({
  recipientEmail: z.string().email().optional(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(AgreementStatus),
});

export async function getAgreements(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const result = await getAgreementsService(user);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAgreementById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const agreementId = req.params.id as string;
    const result = await getAgreementByIdService(agreementId);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function generateAgreement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = generateAgreementSchema.parse(req.body);
    const result = await generateAgreementService(body);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function sendAgreement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const agreementId = req.params.id as string;
    const { recipientEmail } = sendAgreementSchema.parse(req.body || {});
    const result = await sendAgreementService(agreementId, recipientEmail);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateAgreementStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const agreementId = req.params.id as string;
    const { status } = updateStatusSchema.parse(req.body);
    const result = await updateAgreementStatusService(agreementId, status);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}
