import { Router } from "express";
import {
  getAgreements,
  getAgreementById,
  generateAgreement,
  sendAgreement,
  updateAgreementStatus,
} from "../controllers/agreement.controller";
import { authenticateJWT, authorizeRoles } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticateJWT);

router.get("/", getAgreements);
router.get("/:id", getAgreementById);
router.post(
  "/generate",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  generateAgreement
);
router.post(
  "/:id/send",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  sendAgreement
);
router.patch(
  "/:id/status",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER),
  updateAgreementStatus
);

export default router;
