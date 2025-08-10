import { RequestHandler, Router } from "express";
import { saveFcmTokenController } from "../../controllers/app/fcmController.js";
import { authenticate } from "../../middlewares/authMiddleware.js";

const router = Router();

router.post("/", authenticate as RequestHandler, saveFcmTokenController);

export default router;
