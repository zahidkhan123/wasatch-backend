import { RequestHandler, Router } from "express";
import {
  createProperty,
  getProperties,
  getPropertyById,
  deleteProperty,
  updateProperty,
} from "../../controllers/admin/propertyController.js";
import {
  adminAuthMiddleware,
  authenticate,
} from "../../middlewares/authMiddleware.js";
import { validationMiddleware } from "../../middlewares/validationMiddleware.js";
import {
  createPropertySchema,
  updatePropertySchema,
} from "../../validators/admin/propertyRequestValidator.js";

const router = Router();

router.post(
  "/",
  authenticate as RequestHandler,
  validationMiddleware(createPropertySchema),
  adminAuthMiddleware as any,
  createProperty
);

router.get(
  "/",
  // authenticate as RequestHandler,
  // adminAuthMiddleware as any,
  getProperties
);

router.get(
  "/:id",
  authenticate as RequestHandler,
  adminAuthMiddleware as any,
  getPropertyById
);

router.put(
  "/:id",
  authenticate as RequestHandler,
  adminAuthMiddleware as any,
  validationMiddleware(updatePropertySchema),
  updateProperty
);

router.delete(
  "/:id",
  authenticate as RequestHandler,
  adminAuthMiddleware as any,
  deleteProperty
);

export default router;
