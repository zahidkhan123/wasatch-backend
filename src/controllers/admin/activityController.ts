import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async.js";
import {
  useSuccessResponse,
  useErrorResponse,
} from "../../utils/apiResponse.js";
import {
  createActivityLogService,
  getActivityLogsService,
} from "../../services/admin/activityService.js";

const createActivityLogController = catchAsync(
  async (req: Request, res: Response) => {
    const result = await createActivityLogService(req.body);
    if (result.success) {
      useSuccessResponse(res, result.message, result.data, result.statusCode);
    } else {
      useErrorResponse(res, result.message, result.statusCode);
    }
  }
);

const getActivityLogsController = catchAsync(
  async (req: Request, res: Response) => {
    const employeeId = req.query.employeeId as string;
    const result = await getActivityLogsService(
      req.query.page as unknown as number,
      req.query.limit as unknown as number,
      employeeId
    );
    if (result.success) {
      useSuccessResponse(res, result.message, result.data, result.statusCode);
    } else {
      useErrorResponse(res, result.message, result.statusCode);
    }
  }
);

export { getActivityLogsController, createActivityLogController };
