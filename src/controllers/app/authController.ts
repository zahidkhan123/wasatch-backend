import { Request, Response } from "express";
import {
  registerUser,
  registerEmployeeService,
  registerAdminService,
  loginUser,
  sendPasswordResetEmail,
  verifyUserOtp,
  resetUserPassword,
  verifyEmail,
  resendOTP,
} from "../../services/app/authService.js";
import { catchAsync } from "../../utils/catch-async.js";
import {
  useSuccessResponse,
  useErrorResponse,
} from "../../utils/apiResponse.js";
import { responseMessages } from "../../utils/responseMessages.js";

export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await registerUser(req.body);

  if (result.success) {
    useSuccessResponse(
      res,
      result?.message || responseMessages.userRegistered,
      result?.data,
      result?.statusCode || 200
    );
  } else {
    useErrorResponse(
      res,
      result?.message || responseMessages.userRegistered,
      result?.statusCode || 400
    );
  }
});

export const registerEmployee = catchAsync(
  async (req: Request, res: Response) => {
    const result = await registerEmployeeService(req.body);

    if (result.success) {
      useSuccessResponse(
        res,
        result?.message || responseMessages.userRegistered,
        result?.data,
        result?.statusCode || 200
      );
    } else {
      useErrorResponse(
        res,
        result?.message || responseMessages.userRegistered,
        result?.statusCode || 400
      );
    }
  }
);

export const registerAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await registerAdminService(req.body);

  if (result.success) {
    useSuccessResponse(
      res,
      result?.message || responseMessages.userRegistered,
      result?.data,
      result?.statusCode || 200
    );
  } else {
    useErrorResponse(
      res,
      result?.message || responseMessages.userRegistered,
      result?.statusCode || 400
    );
  }
});

export const login = catchAsync(async (req: Request, res: Response) => {
  console.log("req.body", req.body);
  const result = await loginUser(req.body);

  if (result.success) {
    useSuccessResponse(
      res,
      result.message || responseMessages.loginSuccessful,
      result.data,
      result.statusCode || 200
    );
  } else {
    useErrorResponse(
      res,
      result.message || responseMessages.invalidCredentials,
      result.statusCode || 400
    );
  }
});

export const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    const result = await sendPasswordResetEmail(
      req.body.email,
      req.body.user_type
    );
    if (result.success) {
      useSuccessResponse(res, result.message, null, result.statusCode);
    } else {
      useErrorResponse(res, result.message, result.statusCode);
    }
  }
);

export const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, user_type, verify_email } = req.body;
  const response = await verifyUserOtp(email, user_type, otp, verify_email);
  if (response.success) {
    useSuccessResponse(
      res,
      response.message,
      response.data,
      response.statusCode
    );
  } else {
    useErrorResponse(res, response.message, response.statusCode);
  }
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, newPassword, user_type } = req.body;
  const result = await resetUserPassword(email, newPassword, user_type);
  if (result.success) {
    useSuccessResponse(res, result.message, null, result.statusCode);
  } else {
    useErrorResponse(res, result.message, result.statusCode);
  }
});

export const sendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, user_type } = req.body;
  const result = await resendOTP(email, user_type);
  if (result.success) {
    useSuccessResponse(res, result.message, null, result.statusCode);
  } else {
    useErrorResponse(res, result.message, result.statusCode);
  }
});

export const verifyEmailController = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const response = await verifyEmail(req.user?._id as string, email);
    if (response.success) {
      useSuccessResponse(
        res,
        response.message,
        response.data,
        response.statusCode
      );
    } else {
      useErrorResponse(res, response.message, response.statusCode);
    }
  }
);
