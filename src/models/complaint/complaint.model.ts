// models/Issue.ts
import mongoose, { Schema, model, Document } from "mongoose";

const complaintStatusEnum = ["in-progress", "resolved", "closed"];

interface IComplaint extends Document {
  subject?: string;
  description?: string;
  media_url?: string[];
  userId: Schema.Types.ObjectId;
  createdAt: Date;
  status: string;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    subject: { type: String },
    description: { type: String },
    media_url: [{ type: String }],
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: complaintStatusEnum,
      default: "in-progress",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const ComplaintModel = mongoose.model<IComplaint>(
  "Complaint",
  ComplaintSchema
);
