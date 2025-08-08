import {
  Notification,
  NotificationType,
} from "../models/notifications/notification.model.js";

/**
 * Creates and stores a system notification for users or employees
 * @param recipientId - MongoDB _id of the User or Employee
 * @param role - 'user' or 'employee'
 * @param message - Body of the notification
 * @param type - Type of the notification (e.g. pickup_status, shift_reminder)
 */
export const sendNotification = async (
  recipientId: string,
  role: "user" | "employee",
  message: string,
  type: NotificationType
) => {
  try {
    const notification = new Notification({
      recipientId,
      role,
      type,
      message,
      status: "unread",
    });

    await notification.save();
    console.log("Notification saved:", message);
  } catch (error) {
    console.error("Error saving notification:", error);
  }
};
