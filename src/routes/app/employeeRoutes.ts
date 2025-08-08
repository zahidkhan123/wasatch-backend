import express, { RequestHandler } from "express";
import {
  getEmployeeDashboardSummary,
  getEmployeeTasksList,
  getEmployeeTaskById,
  startEmployeeTask,
  endEmployeeTask,
  checkInEmployee,
  checkOutEmployee,
  delayEmployeeTask,
  reportIssueEmployeeTask,
  getWorkHistory,
  deleteEmployeeAccount,
} from "../../controllers/app/employeeController.js";
import {
  employeeAuthMiddleware,
  authenticate,
} from "../../middlewares/authMiddleware.js";
import { validationMiddleware } from "../../middlewares/validationMiddleware.js";
import { issueReportValidator } from "../../validators/employee/issueReportValidator.js";

const router = express.Router();

// Dashboard summary
router.get(
  "/dashboard-summary",
  authenticate as RequestHandler,
  employeeAuthMiddleware as any,
  getEmployeeDashboardSummary
);

router.get(
  "/work-history",
  authenticate as RequestHandler,
  employeeAuthMiddleware as any,
  getWorkHistory
);

// Tasks
router.get(
  "/task",
  authenticate as RequestHandler,
  employeeAuthMiddleware as any,
  getEmployeeTasksList
);

// Task details
router.get(
  "/task/:id",
  authenticate as RequestHandler,
  employeeAuthMiddleware as any,
  getEmployeeTaskById
);

router.post(
  "/task/:id/start",
  authenticate as RequestHandler,
  employeeAuthMiddleware as any,
  startEmployeeTask
);

router.post(
  "/task/:id/end",
  authenticate as RequestHandler,
  employeeAuthMiddleware as any,
  endEmployeeTask
);

router.post(
  "/task/:id/report-issue",
  authenticate as RequestHandler,
  employeeAuthMiddleware as any,
  validationMiddleware(issueReportValidator),
  reportIssueEmployeeTask
);

router.post(
  "/task/:id/delay",
  authenticate as RequestHandler,
  employeeAuthMiddleware as any,
  delayEmployeeTask
);

// Check-in/out
router.post(
  "/check-in",
  authenticate as RequestHandler,
  employeeAuthMiddleware as any,
  checkInEmployee
);

router.post(
  "/check-out",
  authenticate as RequestHandler,
  employeeAuthMiddleware as any,
  checkOutEmployee
);

router.delete(
  "/delete-account",
  authenticate as RequestHandler,
  employeeAuthMiddleware as any,
  deleteEmployeeAccount
);

export default router;
