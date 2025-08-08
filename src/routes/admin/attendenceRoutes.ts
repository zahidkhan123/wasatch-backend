import express, { RequestHandler } from "express";
import {
  getDailyAttendanceController,
  getDailyAttendanceWithHoursController,
  getEmployeeAttendanceHistoryController,
} from "../../controllers/admin/attendenceController.js";

import {
  adminAuthMiddleware,
  authenticate,
} from "../../middlewares/authMiddleware.js";
const router = express.Router();

router.get(
  "/daily",
  authenticate as RequestHandler,
  adminAuthMiddleware as any,
  getDailyAttendanceController
);

router.get(
  "/daily-with-hours",
  authenticate as RequestHandler,
  adminAuthMiddleware as any,
  getDailyAttendanceWithHoursController
);

router.get(
  "/employee-history",
  authenticate as RequestHandler,
  adminAuthMiddleware as any,
  getEmployeeAttendanceHistoryController
);
export default router;
