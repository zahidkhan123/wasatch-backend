import express, { RequestHandler } from "express";
import {
  getTasks,
  assignTaskToEmployee,
  getTaskById,
  reassignTask,
} from "../../controllers/admin/taskController.js";
import {
  adminAuthMiddleware,
  authenticate,
  employeeAuthMiddleware,
} from "../../middlewares/authMiddleware.js";
import { validationMiddleware } from "../../middlewares/validationMiddleware.js";
import { assignTaskToEmployeeSchema } from "../../validators/admin/taskRequestValidator.js";

const router = express.Router();

router.get(
  "/",
  authenticate as RequestHandler,
  adminAuthMiddleware as any,
  getTasks
);

router.get("/:id", authenticate as RequestHandler, getTaskById);

router.post(
  "/assign",
  authenticate as RequestHandler,
  validationMiddleware(assignTaskToEmployeeSchema),
  adminAuthMiddleware as any,
  assignTaskToEmployee
);

router.put(
  "/reassign",
  authenticate as RequestHandler,
  adminAuthMiddleware as any,
  reassignTask
);
export default router;
