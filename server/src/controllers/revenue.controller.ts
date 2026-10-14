import { Request, Response } from "express";
import {
  getMonthCalendarSummaryService,
  getDailyBreakdownService,
  formatDateToDateString,
} from "../services/revenue.service";
import { logger } from "../utils/logger";

export async function getMonthCalendarSummary(req: Request, res: Response) {
  try {
    const now = new Date();
    const year = parseInt(req.query.year as string, 10) || now.getFullYear();
    const month = parseInt(req.query.month as string, 10) || now.getMonth() + 1;
    const branchId = (req.query.branchId as string) || undefined;

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid month parameter. Must be between 1 and 12.",
      });
    }

    const data = await getMonthCalendarSummaryService(year, month, branchId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error("Error in getMonthCalendarSummary:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch calendar revenue summary.",
    });
  }
}

export async function getDailyBreakdown(req: Request, res: Response) {
  try {
    const todayStr = formatDateToDateString(new Date());
    const dateString = (req.query.date as string) || todayStr;
    const branchId = (req.query.branchId as string) || undefined;

    // Validate YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Expected YYYY-MM-DD.",
      });
    }

    const data = await getDailyBreakdownService(dateString, branchId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error("Error in getDailyBreakdown:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch daily revenue breakdown.",
    });
  }
}
