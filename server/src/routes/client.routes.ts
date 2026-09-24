import { Router } from "express";
import { getClients, createClient, onboardClientProfile, getMyProfile, updateClientStatus, updateDocumentStatus, verifyClientDocument, deleteClient, updateClient } from "../controllers/client.controller";
import { authenticateJWT, authorizeRoles } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticateJWT);

router.get("/", getClients);
router.get("/my-profile", getMyProfile);
router.post("/onboard-profile", onboardClientProfile);
router.patch(
  "/:id/status",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER),
  updateClientStatus
);
router.patch(
  "/:id/document-status",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  updateDocumentStatus
);
router.patch(
  "/:id",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER),
  updateClient
);
router.post(
  "/:id/documents",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  verifyClientDocument
);
router.delete(
  "/:id",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER),
  deleteClient
);
router.post(
  "/",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON, Role.IT, Role.MARKETING),
  createClient
);

export default router;
