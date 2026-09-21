import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const loginAttemptsMap = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit records every 5 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttemptsMap.entries()) {
    if (now > record.resetTime) {
      loginAttemptsMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

export function loginRateLimiter(options: { windowMs?: number; max?: number } = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 10; // max 10 requests per windowMs

  return (req: Request, res: Response, next: NextFunction) => {
    // Determine client IP
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const now = Date.now();
    const record = loginAttemptsMap.get(clientIp);

    if (!record || now > record.resetTime) {
      loginAttemptsMap.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (record.count >= max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message: "Too many login attempts from this IP address. Please try again later.",
        retryAfterSeconds,
      });
    }

    record.count += 1;
    return next();
  };
}
