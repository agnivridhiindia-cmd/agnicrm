import { Response, NextFunction } from "express";
import { z } from "zod";
import { ServiceType, PaymentMode, ApprovalStatus, DocumentStatus } from "@prisma/client";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  getClientsService,
  createClientService,
  onboardClientProfileService,
  getMyProfileService,
  updateClientStatusService,
  updateDocumentStatusService,
  verifyClientDocumentService,
  deleteClientService,
  updateClientService,
} from "../services/client.service";

const createClientSchema = z.object({
  companyName: z.string().min(2, "Company name required"),
  contactPerson: z.string().min(2, "Contact person required"),
  name: z.string().min(2, "Client name required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(8, "Phone required"),
  address: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType),
  serviceName: z.string().min(2, "Service name required"),
  amount: z.number().nonnegative("Amount cannot be negative"),
  paymentMode: z.nativeEnum(PaymentMode),
  paymentReceived: z.number().nonnegative("Received payment cannot be negative"),
  gstNo: z.string().optional(),
  adminNotes: z.string().optional(),
  salesPersonEmail: z.string().email().optional(),
  approvalStatus: z.nativeEnum(ApprovalStatus).optional(),
  fundingRequirement: z.number().optional(),
});

const onboardProfileSchema = z.object({
  companyName: z.string().optional().nullable(),
  representativeName: z.string().optional().nullable(),
  contactNumber: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  businessType: z.string().optional().nullable(),
  sector: z.string().optional().nullable(),
  companyAge: z.string().optional().nullable(),
  annualTurnover: z.number().optional().nullable(),
  fundingRequirement: z.number().optional().nullable(),
  companyDescription: z.string().optional().nullable(),
  fundingPurpose: z.string().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  aadharNumber: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  msmeNumber: z.string().optional().nullable(),
  companyPan: z.string().optional().nullable(),
  tanNumber: z.string().optional().nullable(),
  cinNumber: z.string().optional().nullable(),
  twelveARegNumber: z.string().optional().nullable(),
  eightyGCertNumber: z.string().optional().nullable(),
  darpanId: z.string().optional().nullable(),
});

const updateClientStatusSchema = z.object({
  completedSteps: z.array(z.string()),
  applicationStatus: z.string(),
  progressPercent: z.number(),
  adminNotes: z.string().optional(),
});

const updateDocumentStatusSchema = z.object({
  documentStatus: z.nativeEnum(DocumentStatus),
});

export async function getClients(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const result = await getClientsService(user);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function createClient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = createClientSchema.parse(req.body);
    const user = req.user!;
    const result = await createClientService(user, data);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function onboardClientProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = onboardProfileSchema.parse(req.body);
    const user = req.user!;
    const result = await onboardClientProfileService(user, data);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const result = await getMyProfileService(user);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateClientStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const clientId = req.params.id as string;
    const data = updateClientStatusSchema.parse(req.body);
    const result = await updateClientStatusService(clientId, data);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateDocumentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const clientId = req.params.id as string;
    const data = updateDocumentStatusSchema.parse(req.body);
    const result = await updateDocumentStatusService(clientId, data.documentStatus);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

const verifyClientDocumentSchema = z.object({
  documentName: z.string().min(1),
  status: z.nativeEnum(DocumentStatus),
  documentNumber: z.string().optional()
});

export async function verifyClientDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const clientId = req.params.id as string;
    const data = verifyClientDocumentSchema.parse(req.body);
    const result = await verifyClientDocumentService(clientId, data);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteClient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const clientId = req.params.id as string;
    const result = await deleteClientService(clientId);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

const updateClientSchema = z.object({
  name: z.string().optional(),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType).optional(),
  serviceName: z.string().optional(),
  totalPayment: z.number().optional(),
  paymentReceived: z.number().optional(),
  completedSteps: z.array(z.string()).optional(),
  applicationStatus: z.string().optional(),
  progressPercent: z.number().optional(),
  adminNotes: z.string().optional(),
});

export async function updateClient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const clientId = req.params.id as string;
    const data = updateClientSchema.parse(req.body);
    const result = await updateClientService(clientId, data);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}


