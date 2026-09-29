import { Router } from "express";
import { getClients, createClient, onboardClientProfile, getMyProfile, updateClientStatus, updateDocumentStatus, verifyClientDocument, deleteClient, updateClient, updateClientEligibleSchemes, updateClientDueDate, restoreClient } from "../controllers/client.controller";
import { authenticateJWT, authorizeRoles } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticateJWT);

router.get("/", getClients);
router.get("/my-profile", getMyProfile);
router.post("/onboard-profile", onboardClientProfile);
router.patch(
  "/:id/eligible-schemes",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  updateClientEligibleSchemes
);
router.put(
  "/:id/eligible-schemes",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  updateClientEligibleSchemes
);
router.patch(
  "/:id/due-date",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  updateClientDueDate
);
router.put(
  "/:id/due-date",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  updateClientDueDate
);
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
  authorizeRoles(Role.OWNER, Role.ADMIN),
  deleteClient
);
router.post(
  "/:id/restore",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER),
  restoreClient
);
router.post(
  "/",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON, Role.IT, Role.MARKETING),
  createClient
);

export default router;
