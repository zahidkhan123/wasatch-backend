import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async.js";
import {
  useSuccessResponse,
  useErrorResponse,
} from "../../utils/apiResponse.js";
import {
  createUserService,
  getAllUsersService,
  loginUser,
  getAdminDashboardService,
} from "../../services/admin/adminUserService.js";
import { responseMessages } from "../../utils/responseMessages.js";

const loginController = catchAsync(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  if (result.success) {
    useSuccessResponse(res, result.message, result.data, result.statusCode);
  } else {
    useErrorResponse(res, result.message, result.statusCode);
  }
});

const getAllUsersController = catchAsync(
  async (req: Request, res: Response) => {
    const result = await getAllUsersService({
      search: req.query.search as string,
    });
    if (result.success) {
      useSuccessResponse(res, result.message, result.data, result.statusCode);
    } else {
      useErrorResponse(res, result.message, result.statusCode);
    }
  }
);

const createUserController = catchAsync(async (req: Request, res: Response) => {
  const result = await createUserService(req.body);

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

const getAdminDashboardController = catchAsync(
  async (req: Request, res: Response) => {
    const result = await getAdminDashboardService();
    if (result.success) {
      useSuccessResponse(res, result.message, result.data, result.statusCode);
    } else {
      useErrorResponse(res, result.message, result.statusCode);
    }
  }
);

export {
  getAllUsersController,
  createUserController,
  loginController,
  getAdminDashboardController,
};
