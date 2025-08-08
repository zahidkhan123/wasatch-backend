import { RequestHandler, Router } from "express";
import {
  getSettingsController,
  createSettingController,
} from "../../controllers/app/settingsController.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { UserType } from "../../types/enums.js";
const router = Router();

router.get("/", authenticate as RequestHandler, getSettingsController);

router.post(
  "/",
  authenticate as RequestHandler,
  // authorize([UserType.ADMIN]),
  createSettingController
);

export default router;
