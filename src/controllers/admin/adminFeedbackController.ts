import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async.js";
import {
  useSuccessResponse,
  useErrorResponse,
} from "../../utils/apiResponse.js";
import { getFeedbackService } from "../../services/admin/getFeedbackService.js";

const getFeedbackController = catchAsync(
  async (req: Request, res: Response) => {
    const result = await getFeedbackService();
    if (result.success) {
      useSuccessResponse(res, result.message, result.data, result.statusCode);
    } else {
      useErrorResponse(res, result.message, result.statusCode);
    }
  }
);

export { getFeedbackController };
