import { RequestHandler, Router } from "express";
import {
  authenticate,
  authorize,
  employeeAuthMiddleware,
  userAuthMiddleware,
} from "../../middlewares/authMiddleware.js";
import {
  updateUserController,
  deleteUserController,
  updateEmployeeController,
} from "../../controllers/app/userController.js";
import {
  updateUserProfileSchema,
  updateEmployeeProfileSchema,
} from "../../validators/user/userRequestValidator.js";
import { validationMiddleware } from "../../middlewares/validationMiddleware.js";

const router = Router();

router.put(
  "/profile/update",
  userAuthMiddleware as any,
  validationMiddleware(updateUserProfileSchema),
  updateUserController as any
);
router.put(
  "/employee/update",
  employeeAuthMiddleware as any,
  validationMiddleware(updateEmployeeProfileSchema),
  updateEmployeeController as any
);
router.delete("/", userAuthMiddleware as any, deleteUserController as any);
export default router;
