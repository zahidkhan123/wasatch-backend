import { RequestHandler, Router } from "express";
import {
  authenticate,
  authorize,
  userAuthMiddleware,
} from "../../middlewares/authMiddleware.js";
import {
  updateUserController,
  deleteUserController,
} from "../../controllers/app/userController.js";
import { updateUserProfileSchema } from "../../validators/user/userRequestValidator.js";
import { validationMiddleware } from "../../middlewares/validationMiddleware.js";

const router = Router();

router.put(
  "/profile/update",
  userAuthMiddleware as any,
  validationMiddleware(updateUserProfileSchema),
  updateUserController as any
);
router.delete("/", userAuthMiddleware as any, deleteUserController as any);
export default router;
