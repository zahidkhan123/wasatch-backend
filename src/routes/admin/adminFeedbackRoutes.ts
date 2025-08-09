import { Router } from "express";
import { adminAuthMiddleware } from "../../middlewares/authMiddleware.js";
import { getFeedbackController } from "../../controllers/admin/adminFeedbackController.js";

const router = Router();

router.get("/", adminAuthMiddleware as any, getFeedbackController as any);

export default router;
