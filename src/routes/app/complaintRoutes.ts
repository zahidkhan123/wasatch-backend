import express, { RequestHandler } from "express";

import {
  authenticate,
  userAuthMiddleware,
  adminAuthMiddleware,
} from "../../middlewares/authMiddleware.js";
import {
  createComplaintController,
  getComplaintController,
  getAllComplaintsController,
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

router.get(
  "/all",
  authenticate as RequestHandler,
  adminAuthMiddleware as any,
  getAllComplaintsController
);

export default router;
