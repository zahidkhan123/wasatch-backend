import { RequestHandler, Router } from "express";
import {
  authenticate,
  userAuthMiddleware,
} from "../../middlewares/authMiddleware.js";
import { validationMiddleware } from "../../middlewares/validationMiddleware.js";
import { pickupRequestSchema } from "../../validators/user/userRequestValidator.js";
import {
  getPickupRequestsController,
  pickupRequestController,
  getUserDashboardPickupDataController,
  // editPickupRequestController,
} from "../../controllers/app/pickupController.js";

const router = Router();

router.post(
  "/request",
  validationMiddleware(pickupRequestSchema),
  userAuthMiddleware as any,
  pickupRequestController
);

router.get(
  "/requests",
  userAuthMiddleware as any,
  getPickupRequestsController as any
);

router.get(
  "/dashboard",
  userAuthMiddleware as any,
  getUserDashboardPickupDataController as any
);

router.put(
  "/edit/:id",
  userAuthMiddleware as any
  // editPickupRequestController as any
);

export default router;
