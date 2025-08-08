// routes/notificationSetting.routes.ts
import express, { RequestHandler } from "express";
import {
  getNotificationSettingController,
  updateNotificationSettingController,
} from "../../controllers/app/notificationSettingController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { UserType } from "../../types/enums.js";

const router = express.Router();

router.get(
  "/",
  authenticate as RequestHandler,
  //   authorize([UserType.USER, UserType.EMPLOYEE]) as RequestHandler,
  getNotificationSettingController
);
router.put(
  "/",
  authenticate as RequestHandler,
  //   authorize([UserType.USER, UserType.EMPLOYEE]) as RequestHandler,
  updateNotificationSettingController
);

export default router;
