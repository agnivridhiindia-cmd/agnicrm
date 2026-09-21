import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  getNotificationsService,
  markNotificationReadService,
  createNotificationService,
} from "../services/notification.service";

const createNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  detail: z.string().min(1, "Detail is required"),
  issuer: z.string().optional(),
  tone: z.string().optional(),
  targetUserId: z.string().optional(),
  targetRole: z.string().optional(),
});

export async function getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const result = await getNotificationsService(user);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const notifId = req.params.id as string;
    const result = await markNotificationReadService(user, notifId);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function createNotification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = createNotificationSchema.parse(req.body);
    const user = req.user!;
    const result = await createNotificationService(user, data);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}
