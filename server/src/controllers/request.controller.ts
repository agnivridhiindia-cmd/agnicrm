import { Response, NextFunction } from "express";
import { z } from "zod";
import { RequestType } from "@prisma/client";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  getRequestsService,
  createRequestService,
  decideRequestService,
} from "../services/request.service";

const createRequestSchema = z.object({
  clientId: z.string().optional(),
  targetEntityId: z.string().optional(),
  targetEntityType: z.enum(["CLIENT", "EMPLOYEE"]).optional(),
  requestType: z.union([
    z.nativeEnum(RequestType),
    z.string().min(1),
  ]),
  requestedChanges: z.any().optional(),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
});

const decideRequestSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  managerRemarks: z.string().optional(),
});

export async function getRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const result = await getRequestsService(user);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function createRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = createRequestSchema.parse(req.body);
    const user = req.user!;
    const result = await createRequestService(user, data);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function decideRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const requestId = req.params.id as string;
    const bodyDecision = String(req.body.decision || "").toUpperCase();
    const { decision, managerRemarks } = decideRequestSchema.parse({
      ...req.body,
      decision: bodyDecision,
    });
    const user = req.user!;
    const result = await decideRequestService(user, requestId, decision, managerRemarks);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}
