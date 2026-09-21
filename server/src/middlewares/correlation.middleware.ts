import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../utils/logger";

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Extract x-correlation-id or x-request-id from headers, or generate a new UUID
  const headerCorrId = req.headers["x-correlation-id"] || req.headers["x-request-id"];
  const correlationId = Array.isArray(headerCorrId)
    ? headerCorrId[0]
    : headerCorrId || crypto.randomUUID();

  req.correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);

  const startTime = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    logger.info(`HTTP ${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`, {
      correlationId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
}
