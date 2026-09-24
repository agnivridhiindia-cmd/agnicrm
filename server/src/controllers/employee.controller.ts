import { Response, NextFunction } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  createEmployeeService,
  getBranchesService,
  deleteEmployeeService,
  getDeletedEmployeesService,
  restoreEmployeeService,
} from "../services/employee.service";

const createEmployeeSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.nativeEnum(Role, { errorMap: () => ({ message: "Invalid role selected" }) }),
  branchId: z.string().optional(),
  region: z.string().optional(),
  reportingManagerId: z.string().optional(),
});

export async function createEmployee(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = createEmployeeSchema.parse(req.body);
    const result = await createEmployeeService(data);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getBranches(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await getBranchesService();
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteEmployee(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const employeeId = String(req.params.id);
    const deletedBy = req.user?.email || "Owner";
    const reason = req.body?.reason;
    const result = await deleteEmployeeService(employeeId, deletedBy, reason);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getDeletedEmployees(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await getDeletedEmployeesService();
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

export async function restoreEmployee(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const employeeId = String(req.params.id);
    const result = await restoreEmployeeService(employeeId);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}
