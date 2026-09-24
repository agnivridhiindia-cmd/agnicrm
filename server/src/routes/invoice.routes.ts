import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticateJWT, authorizeRoles } from "../middlewares/auth.middleware";
import { getInvoices, createInvoice, addPayment, getPayments } from "../controllers/invoice.controller";

const router = Router();

// Invoice routes
router.get("/", authenticateJWT, getInvoices);
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  createInvoice
);

// Payment routes for an invoice
router.post(
  "/:id/payments",
  authenticateJWT,
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  addPayment
);

// Global payment route (staff access only)
router.get(
  "/payments/all",
  authenticateJWT,
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  getPayments
);

export default router;
