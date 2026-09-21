import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth.middleware";
import { getInvoices, createInvoice, addPayment, getPayments } from "../controllers/invoice.controller";

const router = Router();

// Invoice routes
router.get("/", authenticateJWT, getInvoices);
router.post("/", authenticateJWT, createInvoice);

// Payment routes for an invoice
router.post("/:id/payments", authenticateJWT, addPayment);

// Global payment route
router.get("/payments/all", authenticateJWT, getPayments);

export default router;
