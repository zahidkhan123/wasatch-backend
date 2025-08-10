import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async.js";
import {
  getNotifications,
  updateNotification,
  markAllNotificationsAsReadService,
  sendNotificationService,
} from "../../services/app/notificationService.js";
import {
  useErrorResponse,
  useSuccessResponse,
} from "../../utils/apiResponse.js";
export const getNotificationsController = catchAsync(
  async (req: Request, res: Response) => {
    const user_id = req.user?._id as string;
    const notifications = await getNotifications(user_id);
    if (notifications.success) {
      useSuccessResponse(
        res,
        "Notifications fetched successfully",
        notifications,
        200
      );
    } else {
      useErrorResponse(
        res,
        notifications.message,
        notifications.statusCode || 400
      );
    }
  }
);

export const updateNotificationController = catchAsync(
  async (req: Request, res: Response) => {
    const notification_id = req.params.id;
    const notification = await updateNotification(notification_id);
    if (notification.success) {
      useSuccessResponse(
        res,
        "Notification updated successfully",
        notification,
        200
      );
    } else {
      useErrorResponse(
        res,
        notification.message,
        notification.statusCode || 400
      );
    }
  }
);
export const markAllNotificationsAsReadController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;
    const response = await markAllNotificationsAsReadService(userId);
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

export const sendNotificationController = catchAsync(
  async (req: Request, res: Response) => {
    const user_id = req.user?._id as string;
    const userType = req.user?.role;
    console.log(user_id, userType);
    const { title, body } = req.body;
    const notifications = await sendNotificationService(
      user_id,
      userType,
      title,
      body
    );
    if (notifications.success) {
      useSuccessResponse(
        res,
        "Notification sent successfully",
        notifications,
        200
      );
    } else {
      useErrorResponse(
        res,
        notifications.message,
        notifications.statusCode || 400
      );
    }
  }
);
