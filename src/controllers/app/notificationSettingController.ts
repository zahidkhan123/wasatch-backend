import { Request, Response } from "express";
import {
  useErrorResponse,
  useSuccessResponse,
} from "../../utils/apiResponse.js";
import {
  getNotificationSettingService,
  updateNotificationSettingService,
} from "../../services/app/notificationSettingService.js";
export const getNotificationSettingController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;
    const response = await getNotificationSettingService(userId, userType);

    if (response.success) {
      useSuccessResponse(
        res,
        response.message,
        response.data,
        response.statusCode || 200
      );
    } else {
      useErrorResponse(res, response.message, response.statusCode || 400);
    }
  } catch (err) {
    useErrorResponse(res, "Server error", 500);
  }
};

export const updateNotificationSettingController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;
    const update = req.body;

    const response = await updateNotificationSettingService(userId, update);

    if (response.success) {
      useSuccessResponse(
        res,
        response.message,
        response.data,
        response.statusCode || 200
      );
    } else {
      useErrorResponse(res, response.message, response.statusCode || 400);
    }
  } catch (err) {
    useErrorResponse(res, "Server error", 500);
  }
};
