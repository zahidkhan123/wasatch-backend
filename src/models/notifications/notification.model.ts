import { Schema, model, Document } from "mongoose";

export type NotificationType =
  | "shift_reminder"
  | "missed_checkout"
  | "pickup_status"
  | "admin_alert"
  | "task_assignment"
  | "routine_pickup"
  | "system"
  | "check_in"
  | "check_out"
  | "pickup_missed"
  | "pickup_delayed"
  | "task_completed"
  | "rent_due"
  | "app_feature";

const notificationTypeEnum = [
  "shift_reminder",
  "missed_checkout",
  "pickup_status",
  "admin_alert",
  "task_assignment",
  "routine_pickup",
  "system",
  "check_in",
  "check_out",
  "pickup_missed",
  "pickup_delayed",
  "task_completed",
  "rent_due",
  "app_feature",
];

interface INotification extends Document {
  recipientId: Schema.Types.ObjectId;
  role: "user" | "employee";
  type: NotificationType;
  message: string;
  status: "read" | "unread";
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, required: true },
    role: { type: String, enum: ["user", "employee"], required: true },
    type: {
      type: String,
      enum: notificationTypeEnum,
      required: true,
    },
    message: { type: String, required: true },
    status: { type: String, enum: ["read", "unread"], default: "unread" },
  },
  { timestamps: true }
);

const Notification = model<INotification>("Notification", notificationSchema);

export { Notification, INotification };
