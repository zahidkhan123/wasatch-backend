import { NotificationSettingModel } from "../../models/notifications/notificationSettings.model.js";

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
      setting = await NotificationSettingModel.findOne({ userId }).select(
        "issueUpdates taskStatus"
      );
    } else {
      setting = await NotificationSettingModel.findOne({ userId }).select(
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
    const setting = await NotificationSettingModel.findOneAndUpdate(
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
