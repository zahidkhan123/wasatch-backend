import { Request, Response } from "express";
import * as taskService from "../../services/admin/taskService.js";
import {
  useErrorResponse,
  useSuccessResponse,
} from "../../utils/apiResponse.js";
import { catchAsync } from "../../utils/catch-async.js";

export const getTasks = catchAsync(async (req: Request, res: Response) => {
  const tasks = await taskService.getTasksService(req.query as any);
  if (tasks.success) {
    useSuccessResponse(res, tasks.message, tasks.data, tasks.statusCode);
  } else {
    useErrorResponse(res, tasks.message, tasks.statusCode);
  }
});

export const getTaskById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const task = await taskService.getTaskByIdService(id);

  if (task.success) {
    useSuccessResponse(res, task.message, task.data, task.statusCode);
  } else {
    useErrorResponse(res, task.message, task.statusCode);
  }
});

export const assignTaskToEmployee = catchAsync(
  async (req: Request, res: Response) => {
    const {
      unitNumber,
      buildingName,
      apartmentName,
      propertyId,
      employeeId,
      scheduledDate,
      timeSlot,
      trashTypes,
      specialInstructions,
      isTemporaryAssignment,
      tempAssignmentEndDate,
      tempAssignmentReason,
    } = req.body;

    const task = await taskService.createAndAssignTaskManually({
      unitNumber,
      buildingName,
      apartmentName,
      propertyId,
      employeeId,
      scheduledDate,
      timeSlot,
      trashTypes,
      specialInstructions,
      isTemporaryAssignment,
      tempAssignmentEndDate,
      tempAssignmentReason,
      assignedBy: req.user._id.toString(),
    });
    if (task.success) {
      useSuccessResponse(res, task.message, task.data, task.statusCode);
    } else {
      useErrorResponse(res, task.message, task.statusCode);
    }
  }
);

export const reassignTask = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { taskId, ...updateData } = req.body;

  if (!taskId) {
    return useErrorResponse(res, "Task ID is required", 400);
  }

  const response = await taskService.reassignTaskService({
    id,
    taskId,
    ...updateData,
  });

  if (response.success) {
    return useSuccessResponse(
      res,
      response.message,
      response.data,
      response.statusCode || 200
    );
  } else {
    return useErrorResponse(res, response.message, response.statusCode || 400);
  }
});
