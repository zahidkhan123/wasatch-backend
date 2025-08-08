import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFeedback extends Document {
  userId: Types.ObjectId;
  rating: number;
  pickupTimes: boolean;
  supportSystem: boolean;
  staffPerformance: boolean;
  comment?: string;
  createdAt: Date;
}

const FeedbackSchema: Schema = new Schema<IFeedback>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    pickupTimes: {
      type: Boolean,
      default: false,
    },
    supportSystem: {
      type: Boolean,
      default: false,
    },
    staffPerformance: {
      type: Boolean,
      default: false,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Feedback = mongoose.model<IFeedback>("Feedback", FeedbackSchema);
