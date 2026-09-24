import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";
import {
  createEmployee,
  getBranches,
  deleteEmployee,
  getDeletedEmployees,
  restoreEmployee,
} from "../controllers/employee.controller";

const router = Router();

router.use(authenticateJWT);

// GET /api/v1/employees/branches — list all branches (for the create form dropdown)
router.get(
  "/branches",
  authorizeRoles(Role.OWNER, Role.ADMIN),
  getBranches
);

// GET /api/v1/employees/deleted — list all soft-deleted employees and their archived data
router.get(
  "/deleted",
  authorizeRoles(Role.OWNER, Role.ADMIN),
  getDeletedEmployees
);

// POST /api/v1/employees — create a new employee (Owner/Admin only)
router.post(
  "/",
  authorizeRoles(Role.OWNER, Role.ADMIN),
  createEmployee
);

// DELETE /api/v1/employees/:id — soft delete an employee and archive their clients, schemes, and services
router.delete(
  "/:id",
  authorizeRoles(Role.OWNER, Role.ADMIN),
  deleteEmployee
);

// POST /api/v1/employees/:id/restore — restore a soft-deleted employee
router.post(
  "/:id/restore",
  authorizeRoles(Role.OWNER, Role.ADMIN),
  restoreEmployee
);

export default router;
