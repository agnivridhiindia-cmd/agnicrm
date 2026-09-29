import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth.middleware";
import { subscribeEvents, getEventsStatus } from "../controllers/event.controller";

const router = Router();

// Stream endpoint for browser EventSource
router.get("/stream", authenticateJWT, subscribeEvents);

// SSE connection health check
router.get("/status", authenticateJWT, getEventsStatus);

export default router;
