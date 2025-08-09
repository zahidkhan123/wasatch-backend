import { Feedback } from "../../models/Feedback/feedback.model.js";
import { User } from "../../models/user.model.js";
import { Types } from "mongoose";

interface CreateFeedbackInput {
  userId: string;
  rating: number;
  pickupTimes: boolean;
  supportSystem: boolean;
  staffPerformance: boolean;
  comment?: string;
}

export const createFeedbackService = async (data: CreateFeedbackInput) => {
  try {
    const user = await User.findById(data.userId);
    if (!user) {
      return {
        success: false,
        message: "User not found.",
        statusCode: 404,
      };
    }
    const existingFeedback = await Feedback.findOne({ userId: data.userId });
    if (existingFeedback) {
      return {
        success: false,
        message: "Feedback already submitted.",
        statusCode: 400,
      };
    }
    const feedback = await Feedback.create({
      userId: (user as { _id: Types.ObjectId })._id,
      rating: data.rating,
      pickupTimes: data.pickupTimes,
      supportSystem: data.supportSystem,
      staffPerformance: data.staffPerformance,
      comment: data.comment?.trim() || undefined,
    });

    return {
      success: true,
      message: "Feedback submitted successfully.",
      statusCode: 201,
      data: feedback,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to submit feedback.",
      statusCode: 400,
      error: error.message,
    };
  }
};
