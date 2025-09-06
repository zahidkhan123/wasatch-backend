// models/activityLog.model.ts
import { Schema, model, Document } from "mongoose";

export type ActivityType =
  | "PICKUP_COMPLETED"
  | "MISSED_PICKUP"
  | "NEW_REQUEST"
  | "TASK_STARTED"
  | "TASK_COMPLETED"
  | "TASK_MISSED"
  | "ISSUE_REPORTED";

export interface IActivityLog extends Document {
  employeeId?: string; // optional, e.g. Missed Pickup may not have an employee
  employeeName?: string;
  unitNumber: string;
  type: ActivityType;
  requestType?: string; // e.g. "On-Demand"
  taskId?: string; // Reference to the task
  issueId?: string; // Reference to the issue report
  timestamp: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee" },
    employeeName: { type: String },
    unitNumber: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "PICKUP_COMPLETED",
        "MISSED_PICKUP",
        "NEW_REQUEST",
        "TASK_STARTED",
        "TASK_COMPLETED",
        "TASK_MISSED",
        "ISSUE_REPORTED",
      ],
      required: true,
    },
    requestType: { type: String }, // e.g. On-Demand
    taskId: { type: Schema.Types.ObjectId, ref: "Task" },
    issueId: { type: Schema.Types.ObjectId, ref: "Issue" },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ActivityLog = model<IActivityLog>(
  "ActivityLog",
  activityLogSchema
);
