import { Router } from "express";
import { getRequests, createRequest, decideRequest, approveRequest, declineRequest } from "../controllers/request.controller";
import { authenticateJWT, authorizeRoles } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticateJWT);

router.get("/", getRequests);
router.post("/", createRequest);
router.patch(
  "/:id/decision",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  decideRequest
);
router.post(
  "/:id/decision",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  decideRequest
);
router.post(
  "/:id/approve",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  approveRequest
);
router.post(
  "/:id/decline",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER, Role.SALES_PERSON),
  declineRequest
);

export default router;
