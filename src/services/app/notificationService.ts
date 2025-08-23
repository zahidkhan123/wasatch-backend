import { Notification } from "../../models/notifications/notification.model.js";
import { User } from "../../models/user.model.js";
import { Employee } from "../../models/employee/employee.model.js";
import admin from "firebase-admin";

export const getNotifications = async (user_id: string) => {
  try {
    const notifications = await Notification.find({
      recipientId: user_id,
    })
      .populate("recipientId", "name email")
      .select("title message is_read createdAt image")
      .sort({ createdAt: -1 }); // Newest first
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

export const sendNotificationService = async (
  user_id: string,
  userType: string,
  title: string,
  body: string
) => {
  try {
    let message: any;
    if (userType === "user") {
      const user = await User.findOne({ _id: user_id });
      if (!user || !user.fcmTokens) {
        return {
          success: false,
          message: "User or FCM token not found",
          statusCode: 404,
        };
      }
      message = {
        tokens: user.fcmTokens,
        notification: { title, body },
        // data: { click_action: "FLUTTER_NOTIFICATION_CLICK" }, // optional
      };
    } else {
      const employee = await Employee.findOne({ _id: user_id });
      if (!employee || !employee.fcmTokens) {
        return {
          success: false,
          message: "Employee or FCM token not found",
          statusCode: 404,
        };
      }
      message = {
        tokens: employee.fcmTokens,
        notification: { title, body },
        // data: { click_action: "FLUTTER_NOTIFICATION_CLICK" }, // optional
      };
    }

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(response);

    return {
      success: true,
      message: "Notification sent",
      statusCode: 200,
      data: null,
    };
  } catch (error) {
    console.error("Error sending notification:", error);
    return {
      success: false,
      message: "Failed to send notification",
      statusCode: 500,
      error,
    };
  }
};
