import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { addSseClient, removeSseClient, getSseSubscriberCount } from "../services/sse.service";
import crypto from "crypto";

/**
 * Handles incoming EventSource HTTP connections for real-time SSE stream
 */
export function subscribeEvents(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthenticated." });
  }

  const clientId = `sse_${req.user.userId}_${crypto.randomBytes(4).toString("hex")}`;

  addSseClient({
    id: clientId,
    userId: req.user.userId,
    role: req.user.role,
    branchId: req.user.branchId || null,
    res,
  });

  req.on("close", () => {
    removeSseClient(clientId);
  });
}

/**
 * Health/status info for SSE service
 */
export function getEventsStatus(_req: AuthenticatedRequest, res: Response) {
  return res.json({
    success: true,
    subscribers: getSseSubscriberCount(),
    timestamp: new Date().toISOString(),
  });
}
