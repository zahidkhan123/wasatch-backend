import { Router } from "express";
import { feedbackValidationSchema } from "../../validators/user/userRequestValidator.js";
import { validationMiddleware } from "../../middlewares/validationMiddleware.js";
import { userAuthMiddleware } from "../../middlewares/authMiddleware.js";
import { createFeedbackController } from "../../controllers/app/feedbackController.js";

const router = Router();

router.post(
  "/submit",
  validationMiddleware(feedbackValidationSchema),
  userAuthMiddleware as any,
  createFeedbackController as any
);

export default router;
