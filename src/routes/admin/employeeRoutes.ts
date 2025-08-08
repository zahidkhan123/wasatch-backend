import express, { RequestHandler } from "express";
import {
  getEmployees,
  getEmployeeById,
} from "../../controllers/admin/employeeController.js";

import {
  adminAuthMiddleware,
  authenticate,
} from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authenticate as RequestHandler,
  adminAuthMiddleware as any,
  getEmployees
);

router.get(
  "/:id",
  authenticate as RequestHandler,
  adminAuthMiddleware as any,
  getEmployeeById
);

export default router;
