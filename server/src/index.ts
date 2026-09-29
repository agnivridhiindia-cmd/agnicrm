import express from "express";
import cors from "cors";
import { ENV } from "./config/env";
import { prisma } from "./config/prisma";
import { logger } from "./utils/logger";
import { correlationMiddleware } from "./middlewares/correlation.middleware";

import authRoutes from "./routes/auth.routes";
import clientRoutes from "./routes/client.routes";
import requestRoutes from "./routes/request.routes";
import agreementRoutes from "./routes/agreement.routes";
import invoiceRoutes from "./routes/invoice.routes";
import notificationRoutes from "./routes/notification.routes";
import employeeRoutes from "./routes/employee.routes";
import eventRoutes from "./routes/event.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();
const PORT = ENV.PORT;

// Robust CORS domain whitelisting
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      
      // Check allowed origins list, vercel deployments, localtunnel, or local development pattern
      const isAllowed =
        ENV.ALLOWED_ORIGINS.includes(origin) ||
        ENV.NODE_ENV === "development" ||
        /\.vercel\.app$/.test(origin) ||
        /\.loca\.lt$/.test(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

// Standard HTTP Security Headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

app.use(express.json());

// Request correlation ID and structured logger middleware
app.use(correlationMiddleware);

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/agreements", agreementRoutes);
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/events", eventRoutes);

// Database-backed Health Check Handler
const healthCheckHandler = async (req: express.Request, res: express.Response) => {
  const startMs = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startMs;

    return res.status(200).json({
      status: "UP",
      service: "Agni CRM Backend API",
      database: {
        status: "CONNECTED",
        provider: "PostgreSQL",
        latencyMs,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("Health check failed: PostgreSQL database unreachable", {
      correlationId: req.correlationId,
      error: error?.message || error,
    });

    return res.status(503).json({
      status: "DOWN",
      service: "Agni CRM Backend API",
      database: {
        status: "DISCONNECTED",
        error: "PostgreSQL database unreachable or query failed",
      },
      timestamp: new Date().toISOString(),
    });
  }
};

app.get("/api/v1/health", healthCheckHandler);
app.get("/health", healthCheckHandler);

// Global Error Handler Middleware
app.use(errorHandler);

app.listen(PORT, "0.0.0.0", () => {
  logger.info(`🚀 Agni CRM Backend API running on http://localhost:${PORT} (pool: 20 conn)`, {
    environment: ENV.NODE_ENV,
    port: PORT,
    allowedOrigins: ENV.ALLOWED_ORIGINS,
  });
});

