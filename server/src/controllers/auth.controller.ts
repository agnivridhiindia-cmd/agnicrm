import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { loginUser, getUserProfile, getUsersService, refreshAccessTokenService } from "../services/auth.service";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required"),
});

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const credentials = loginSchema.parse(req.body);
    const result = await loginUser(credentials);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await refreshAccessTokenService(refreshToken);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthenticated." });
    }

    const result = await getUserProfile(req.user.userId);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { role, branchId } = req.query;
    const result = await getUsersService({
      role: role ? String(role) : undefined,
      branchId: branchId ? String(branchId) : undefined,
    });
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}
