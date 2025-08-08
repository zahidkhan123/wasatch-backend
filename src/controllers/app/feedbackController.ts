import { Request, Response } from "express";
import { createFeedbackService } from "../../services/app/feedbackService.js";
import {
  useErrorResponse,
  useSuccessResponse,
} from "../../utils/apiResponse.js";

export const createFeedbackController = async (req: Request, res: Response) => {
  const { rating, pickupTimes, supportSystem, staffPerformance, comment } =
    req.body;
  const userId = req.user?._id.toString();
  const response = await createFeedbackService({
    userId,
    rating,
    pickupTimes,
    supportSystem,
    staffPerformance,
    comment,
  });
  if (response.success) {
    useSuccessResponse(
      res,
      response.message,
      response.data,
      response.statusCode || 201
    );
  } else {
    useErrorResponse(res, response.message, response.statusCode || 400);
  }
};
