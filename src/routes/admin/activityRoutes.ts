import { Router } from "express";
import { adminAuthMiddleware } from "../../middlewares/authMiddleware.js";
import {
  createActivityLogController,
  getActivityLogsController,
} from "../../controllers/admin/activityController.js";

const router = Router();

router.get("/", adminAuthMiddleware as any, getActivityLogsController as any);

export default router;
