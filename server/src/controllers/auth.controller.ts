import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  loginUser,
  getUserProfile,
  getUsersService,
  refreshAccessTokenService,
  changePasswordService,
} from "../services/auth.service";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(1, "New password is required"),
  confirmPassword: z.string().optional(),
  email: z.string().optional(),
  role: z.string().optional(),
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

export async function changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword, confirmPassword, email, role } = changePasswordSchema.parse(req.body);
    const userId = req.user?.userId;
    const userEmail = req.user?.email || email;

    const result = await changePasswordService({
      userId,
      email: userEmail,
      role,
      currentPassword,
      newPassword,
      confirmPassword,
    });

    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

