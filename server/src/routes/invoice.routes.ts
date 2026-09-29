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
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON, Role.CLIENT),
  addPayment
);

// Global payment route (scoped to client records for Role.CLIENT, staff sees their respective scope)
router.get(
  "/payments/all",
  authenticateJWT,
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON, Role.CLIENT),
  getPayments
);

export default router;
