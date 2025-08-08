import { RequestHandler, Router } from "express";
import {
  adminAuthMiddleware,
  authenticate,
  authorize,
} from "../../middlewares/authMiddleware.js";
import { UserType } from "../../types/enums.js";
import {
  getAllUsersController,
  createUserController,
  loginController,
  getAdminDashboardController,
} from "../../controllers/admin/adminUserController.js";
import { validationMiddleware } from "../../middlewares/validationMiddleware.js";
import {
  // createUserSchema,
  loginSchema,
} from "../../validators/admin/userRequestValidator.js";
const router = Router();

router.get(
  "/",
  authenticate as RequestHandler,
  adminAuthMiddleware as any,
  getAllUsersController
);

router.post("/login", validationMiddleware(loginSchema), loginController);

router.post(
  "/",
  authenticate as RequestHandler,
  // validationMiddleware(createUserSchema),
  createUserController
);

router.get(
  "/dashboard",
  adminAuthMiddleware as any,
  getAdminDashboardController
);

export default router;
