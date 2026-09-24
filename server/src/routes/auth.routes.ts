import { Router } from "express";
import { login, refresh, getMe, getUsers, changePassword } from "../controllers/auth.controller";
import { authenticateJWT, optionalAuthenticateJWT } from "../middlewares/auth.middleware";
import { loginRateLimiter } from "../middlewares/rateLimiter.middleware";

const router = Router();

router.post("/login", loginRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), login);
router.post("/refresh", refresh);
router.get("/me", authenticateJWT, getMe);
router.get("/users", authenticateJWT, getUsers);
router.post(
  "/change-password",
  loginRateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  optionalAuthenticateJWT,
  changePassword
);

export default router;

