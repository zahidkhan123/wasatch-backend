import { Request, Response } from "express";
import {
  getDashboardSummary,
  getEmployeeTasks,
  getTaskById,
  startTask,
  endTask,
  checkIn,
  checkOut,
  delayTask,
  reportIssueTask,
  getEmployeeWorkHistory,
  FilterOption,
  deleteEmployeeAccountService,
} from "../../services/app/employeeService";
import { useErrorResponse, useSuccessResponse } from "../../utils/apiResponse";
import { catchAsync } from "../../utils/catch-async";

const getEmployeeDashboardSummary = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.user?._id as string;
    console.log(id);
    const tasks = await getDashboardSummary(id);
    if (tasks.success) {
      useSuccessResponse(res, tasks.message, tasks.data, tasks.statusCode);
    } else {
      useErrorResponse(res, tasks.message, tasks.statusCode);
    }
  }
);
const getEmployeeTasksList = catchAsync(async (req: Request, res: Response) => {
  const employee_id = req.user?._id as string;
  const task = await getEmployeeTasks(employee_id, req.query as any);
  if (task.success) {
    useSuccessResponse(res, task.message, task.data, task.statusCode);
  } else {
    useErrorResponse(res, task.message, task.statusCode);
  }
});
const getEmployeeTaskById = catchAsync(async (req: Request, res: Response) => {
  const { id: task_id } = req.params;
  const task = await getTaskById(task_id);
  if (task.success) {
    useSuccessResponse(res, task.message, task.data, task.statusCode);
  } else {
    useErrorResponse(res, task.message, task.statusCode);
  }
});
const startEmployeeTask = catchAsync(async (req: Request, res: Response) => {
  const task_id = req.params.id;
  const employee_id = req.user?._id as string;
  const result = await startTask(task_id, employee_id);
  if (result.success) {
    useSuccessResponse(res, result.message, result.data, result.statusCode);
  } else {
    useErrorResponse(res, result.message, result.statusCode);
  }
});
const endEmployeeTask = catchAsync(async (req: Request, res: Response) => {
  const task_id = req.params.id;
  const employee_id = req.user?._id as string;
  const result = await endTask(task_id, employee_id);
  if (result.success) {
    useSuccessResponse(res, result.message, result.data, result.statusCode);
  } else {
    useErrorResponse(res, result.message, result.statusCode);
  }
});
const checkInEmployee = catchAsync(async (req: Request, res: Response) => {
  const employee_id = req.user?._id as string;
  const { propertyId, location } = req.body;

  const result = await checkIn(employee_id, propertyId, location);
  if (result.success) {
    useSuccessResponse(res, result.message, result.data, result.statusCode);
  } else {
    useErrorResponse(res, result.message, result.statusCode);
  }
});
const checkOutEmployee = catchAsync(async (req: Request, res: Response) => {
  const employee_id = req.user?._id as string;
  const { propertyId, location } = req.body;
  const result = await checkOut(employee_id, propertyId, location);
  if (result.success) {
    useSuccessResponse(res, result.message, result.data, result.statusCode);
  } else {
    useErrorResponse(res, result.message, result.statusCode);
  }
});

const delayEmployeeTask = catchAsync(async (req: Request, res: Response) => {
  const task_id = req.params.id;
  const employee_id = req.user?._id as string;
  const result = await delayTask(task_id, employee_id);
  if (result.success) {
    useSuccessResponse(res, result.message, result.data, result.statusCode);
  } else {
    useErrorResponse(res, result.message, result.statusCode);
  }
});

const reportIssueEmployeeTask = catchAsync(
  async (req: Request, res: Response) => {
    const task_id = req.params.id;
    const employee_id = req.user?._id as string;
    const { issueType, description, mediaUrl } = req.body;
    const result = await reportIssueTask(
      task_id,
      employee_id,
      issueType,
      description,
      mediaUrl
    );
    if (result.success) {
      useSuccessResponse(res, result.message, result.data, result.statusCode);
    } else {
      useErrorResponse(res, result.message, result.statusCode);
    }
  }
);

const getWorkHistory = catchAsync(async (req: Request, res: Response) => {
  const employee_id = req.user?._id as string;
  const filter = (req.query.filter as FilterOption) || "all";
  const history = await getEmployeeWorkHistory(employee_id, filter);
  if (history.success) {
    useSuccessResponse(res, history.message, history.data, history.statusCode);
  } else {
    useErrorResponse(res, history.message, history.statusCode);
  }
});

const deleteEmployeeAccount = catchAsync(
  async (req: Request, res: Response) => {
    const employee_id = req.user?._id as string;
    const result = await deleteEmployeeAccountService(employee_id);
    if (result.success) {
      useSuccessResponse(res, result.message, result.data, result.statusCode);
    } else {
      useErrorResponse(res, result.message, result.statusCode);
    }
  }
);

export {
  getEmployeeDashboardSummary,
  getEmployeeTasksList,
  getEmployeeTaskById,
  startEmployeeTask,
  endEmployeeTask,
  checkInEmployee,
  checkOutEmployee,
  delayEmployeeTask,
  reportIssueEmployeeTask,
  getWorkHistory,
  deleteEmployeeAccount,
};
