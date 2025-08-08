import { Notification } from "../../models/notifications/notification.model.js";

/**
 * Get notification settings for a user.
 */
export const getNotificationSettingService = async (
  userId: string,
  userType: string
) => {
  try {
    let setting;
    if (userType === "user") {
      setting = await Notification.findOne({ userId }).select(
        "issueUpdates taskStatus"
      );
    } else {
      setting = await Notification.findOne({ userId }).select(
        "-_id -__v -createdAt -updatedAt -userId -role"
      );
    }

    return {
      success: true,
      message: "Notification setting fetched successfully",
      statusCode: 200,
      data: setting,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to get notification setting",
      statusCode: 500,
    };
  }
};

/**
 * Update notification settings for a user.
 */
export const updateNotificationSettingService = async (
  userId: string,
  update: any
) => {
  try {
    const setting = await Notification.findOneAndUpdate(
      { userId },
      { ...update },
      { new: true, upsert: true }
    );
    return {
      success: true,
      message: "Notification setting updated successfully",
      statusCode: 200,
      data: setting,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to update notification setting",
      statusCode: 500,
    };
  }
};
