import express, { RequestHandler } from "express";

import {
  authenticate,
  userAuthMiddleware,
} from "../../middlewares/authMiddleware.js";
import {
  createComplaintController,
  getComplaintController,
} from "../../controllers/app/complaintController.js";
import { createComplaintSchema } from "../../validators/complaint/createComplaintValidator.js";
import { validationMiddleware } from "../../middlewares/validationMiddleware.js";
const router = express.Router();

router.post(
  "/",
  authenticate as RequestHandler,
  userAuthMiddleware as any,
  validationMiddleware(createComplaintSchema),
  createComplaintController
);
router.get(
  "/",
  authenticate as RequestHandler,
  userAuthMiddleware as any,
  getComplaintController
);

export default router;
