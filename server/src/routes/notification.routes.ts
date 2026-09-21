import { Router } from "express";
import { getNotifications, markAsRead, createNotification } from "../controllers/notification.controller";
import { authenticateJWT } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateJWT);

router.get("/", getNotifications);
router.post("/", createNotification);
router.patch("/:id/read", markAsRead);

export default router;
