import express, { RequestHandler } from "express";
import {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  sendOtp,
  registerEmployee,
  registerAdmin,
  verifyEmailController,
} from "../../controllers/app/authController.js";
import {
  adminAuthMiddleware,
  authenticate,
  authorize,
} from "../../middlewares/authMiddleware.js";
import { validationMiddleware } from "../../middlewares/validationMiddleware.js";
import {
  registerUserSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  registerAdminSchema,
  registerEmployeeSchema,
} from "../../validators/auth/authRequestValidator.js";
import { UserType } from "../../types/enums.js";
import { useResponse } from "../../utils/rateLimiter.js";
const router = express.Router();

// Rate limit: 1 requests per minute (1 * 60 * 1000 milliseconds = 1 minute)
const registerLimiter = useResponse(1 * 60 * 1000, 20); // Allow 20 attempts per 1 minute for registration
const loginLimiter = useResponse(1 * 60 * 1000, 10); // Allow 10 attempts per 1 minute for login
const sendOtpLimiter = useResponse(1 * 60 * 1000, 30); // Allow 10 attempts per 1 minute for OTP verification
const verifyOtpLimiter = useResponse(1 * 60 * 1000, 5); // Allow 5 attempts per minute for OTP verification

router.post(
  "/register/user",
  registerLimiter,
  validationMiddleware(registerUserSchema),
  register
);

router.post(
  "/register/employee",
  registerLimiter,
  validationMiddleware(registerEmployeeSchema),
  adminAuthMiddleware as any,
  registerEmployee
);

router.post(
  "/register/admin",
  registerLimiter,
  validationMiddleware(registerAdminSchema),
  // adminAuthMiddleware as any,
  registerAdmin
);
router.post("/login", loginLimiter, validationMiddleware(loginSchema), login);
router.post(
  "/forgot-password",
  sendOtpLimiter,
  validationMiddleware(forgotPasswordSchema),
  forgotPassword
);

router.post(
  "/verify-email",
  authenticate as RequestHandler,
  // authorize([UserType.USER]),
  validationMiddleware(verifyEmailSchema),
  verifyEmailController
);

router.post(
  "/send-otp",
  sendOtpLimiter,
  validationMiddleware(forgotPasswordSchema),
  sendOtp
);
router.post(
  "/verify-otp",
  verifyOtpLimiter,
  validationMiddleware(verifyOtpSchema),
  verifyOtp
);
router.post(
  "/reset-password",
  validationMiddleware(resetPasswordSchema),
  authorize as any,
  resetPassword
);

export default router;
