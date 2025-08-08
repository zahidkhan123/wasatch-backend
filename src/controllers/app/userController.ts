import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async.js";
import {
  useSuccessResponse,
  useErrorResponse,
} from "../../utils/apiResponse.js";
import {
  updateUserService,
  deleteUserService,
} from "../../services/app/userService.js";
import { UserType } from "../../types/enums.js";

export const updateUserController = catchAsync(
  async (req: Request, res: Response) => {
    const user_id = req.user?._id as string;

    const result = await updateUserService(user_id, req.body);
    if (result.success) {
      useSuccessResponse(res, result.message, result.data, result.statusCode);
    } else {
      useErrorResponse(res, result.message, result.statusCode);
    }
  }
);

export const deleteUserController = catchAsync(
  async (req: Request, res: Response) => {
    const user_id = req.user?._id as string;
    const user_type = req.user?.user_type as UserType;
    const { email } = req.body;
    const result = await deleteUserService(user_id, user_type, email);

    if (result.success) {
      useSuccessResponse(res, result.message, result.data, result.statusCode);
    } else {
      useErrorResponse(res, result.message, result.statusCode);
    }
  }
);
