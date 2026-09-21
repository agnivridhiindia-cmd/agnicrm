import { Router } from "express";
import { getRequests, createRequest, decideRequest } from "../controllers/request.controller";
import { authenticateJWT, authorizeRoles } from "../middlewares/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticateJWT);

router.get("/", getRequests);
router.post("/", createRequest);
router.patch(
  "/:id/decision",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER),
  decideRequest
);
router.post(
  "/:id/decision",
  authorizeRoles(Role.OWNER, Role.ADMIN, Role.BRANCH_MANAGER, Role.MANAGER),
  decideRequest
);

export default router;
