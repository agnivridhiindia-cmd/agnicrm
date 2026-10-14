import { Router } from "express";
import { optionalAuthenticateJWT } from "../middlewares/auth.middleware";
import {
  getMonthCalendarSummary,
  getDailyBreakdown,
} from "../controllers/revenue.controller";

const router = Router();

// Allow authenticated users (Owner, Admin, Managers) or optional token validation
router.use(optionalAuthenticateJWT);

// GET /api/v1/revenue/calendar-summary?year=YYYY&month=MM&branchId=...
router.get("/calendar-summary", getMonthCalendarSummary);

// GET /api/v1/revenue/daily-breakdown?date=YYYY-MM-DD&branchId=...
router.get("/daily-breakdown", getDailyBreakdown);

export default router;
