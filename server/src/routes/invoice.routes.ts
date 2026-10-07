import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticateJWT, authorizeRoles } from "../middlewares/auth.middleware";
import {
  getInvoices,
  createInvoice,
  addPayment,
  getPayments,
  createPaymentRequest,
  settlePaymentDemand,
  markPaymentPaid,
} from "../controllers/invoice.controller";

const router = Router();

// Invoice routes
router.get("/", authenticateJWT, getInvoices);
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  createInvoice
);

// Payment demand / request creation
router.post(
  "/payment-requests",
  authenticateJWT,
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  createPaymentRequest
);

// Settle payment request by client (or staff)
router.patch(
  ["/payments/:id/settle", "/payments/:id(*)/settle"],
  authenticateJWT,
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON, Role.CLIENT),
  settlePaymentDemand
);
router.post(
  ["/payments/:id/settle", "/payments/:id(*)/settle"],
  authenticateJWT,
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON, Role.CLIENT),
  settlePaymentDemand
);

// Mark payment as paid by sales representative / manager / owner
router.patch(
  ["/payments/:id/mark-paid", "/payments/:id(*)/mark-paid"],
  authenticateJWT,
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  markPaymentPaid
);
router.post(
  ["/payments/:id/mark-paid", "/payments/:id(*)/mark-paid"],
  authenticateJWT,
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  markPaymentPaid
);

// Payment routes for an invoice (supports UUIDs and slashed invoice numbers like INV-dd/mm/yyyy-001)
router.post(
  ["/:id/payments", "/:id(*)/payments"],
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

