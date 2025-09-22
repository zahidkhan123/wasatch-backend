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
  updateComplaintController,
} from "../../controllers/app/complaintController.js";
import {
  createComplaintSchema,
  updateComplaintSchema,
} from "../../validators/complaint/createComplaintValidator.js";
import { validationMiddleware } from "../../middlewares/validationMiddleware.js";
const router = express.Router();

router.post(
  "/",
  authenticate as RequestHandler,
  userAuthMiddleware as any,
  validationMiddleware(createComplaintSchema),
  createComplaintController
);

router.put(
  "/update",
  authenticate as RequestHandler,
  adminAuthMiddleware as any,
  validationMiddleware(updateComplaintSchema),
  updateComplaintController
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
