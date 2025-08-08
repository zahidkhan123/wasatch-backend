// models/notificationSetting.model.ts
import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "user" | "employee";

export interface INotificationSetting extends Document {
  userId: mongoose.Types.ObjectId;
  role: UserRole;
  newTaskAssigned: boolean;
  issueUpdates: boolean;
  taskStatus: boolean;
  clockInOutReminders?: boolean;
  adminInstructions?: boolean;
}

const NotificationSettingSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      unique: true,
    },
    role: { type: String, enum: ["user", "employee"], required: true },
    newTaskAssigned: { type: Boolean, default: true },
    issueUpdates: { type: Boolean, default: true },
    taskStatus: { type: Boolean, default: true },
    clockInOutReminders: { type: Boolean, default: false },
    adminInstructions: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const NotificationSettingModel = mongoose.model<INotificationSetting>(
  "NotificationSetting",
  NotificationSettingSchema
);
