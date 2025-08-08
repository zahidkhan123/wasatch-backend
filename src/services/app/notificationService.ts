import { Notification } from "../../models/notifications/notification.model.js";

export const getNotifications = async (user_id: string) => {
  try {
    const notifications = await Notification.find({
      recipientId: user_id,
    })
      .populate("recipientId", "name email")
      .select("title message is_read createdAt");
    return {
      success: true,
      message: "Notifications fetched successfully",
      statusCode: 200,
      data: notifications,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch notifications",
      statusCode: 500,
      error,
    };
  }
};

export const updateNotification = async (notification_id: string) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notification_id,
      {
        isRead: true,
      },
      { new: true }
    );
    return {
      success: true,
      message: "Notification updated successfully",
      statusCode: 200,
      data: notification,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to update notification",
      statusCode: 500,
      error,
    };
  }
};

export const markAllNotificationsAsReadService = async (userId: string) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: userId, isRead: { $ne: true } },
      { $set: { isRead: true } }
    );
    return {
      success: true,
      message: "All notifications marked as read successfully",
      statusCode: 200,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to mark all notifications as read",
      statusCode: 500,
      error,
    };
  }
};
