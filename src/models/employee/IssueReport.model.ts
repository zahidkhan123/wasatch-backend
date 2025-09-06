// models/Issue.ts
import { Schema, model, Document } from "mongoose";

export interface IssueDocument extends Document {
  taskId: Schema.Types.ObjectId;
  employeeId: Schema.Types.ObjectId;
  issueType?: string;
  subject?: string;
  description?: string;
  mediaUrl?: string[];
  createdAt: Date;
}

const IssueSchema = new Schema<IssueDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: false },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    issueType: { type: String },
    subject: { type: String },
    description: { type: String },
    mediaUrl: [{ type: String }],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const IssueModel = model<IssueDocument>("Issue", IssueSchema);
