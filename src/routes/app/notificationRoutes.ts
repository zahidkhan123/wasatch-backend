import express, { RequestHandler } from "express";
import {
  getNotificationsController,
  updateNotificationController,
  markAllNotificationsAsReadController,
} from "../../controllers/app/notificationController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
const router = express.Router();

router.get(
  "/",
  authenticate as RequestHandler,
  // authorize([UserType.USER]),
  getNotificationsController
);

router.put(
  "/",
  authenticate as RequestHandler,
  // authorize([UserType.USER]),
  updateNotificationController
);

router.put(
  "/mark-all-as-read",
  authenticate as RequestHandler,
  markAllNotificationsAsReadController
);
export default router;
