import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async.js";
import {
  fetchDailyAttendance,
  fetchDailyAttendanceWithHours,
  fetchEmployeeAttendanceHistory,
} from "../../services/admin/attendenceService.js";
import {
  useErrorResponse,
  useSuccessResponse,
} from "../../utils/apiResponse.js";
export const getDailyAttendanceController = catchAsync(
  async (req: Request, res: Response) => {
    const { date, name, employeeId } = req.query as {
      date?: string;
      name?: string;
      employeeId?: string;
    };

    console.log("date", date);
    console.log("name", name);
    console.log("employeeId", employeeId);
    const attendance = await fetchDailyAttendance({ date, name, employeeId });
    if (attendance.success) {
      useSuccessResponse(
        res,
        "Daily attendance fetched successfully",
        attendance.data,
        200
      );
    } else {
      useErrorResponse(res, attendance.message, attendance.statusCode);
    }
  }
);

export const getDailyAttendanceWithHoursController = catchAsync(
  async (req: Request, res: Response) => {
    const date = req.params.date;
    const attendance = await fetchDailyAttendanceWithHours(date);
    if (attendance.success) {
      useSuccessResponse(
        res,
        "Daily attendance with hours fetched successfully",
        attendance.data,
        200
      );
    } else {
      useErrorResponse(res, attendance.message, attendance.statusCode);
    }
  }
);

export const getEmployeeAttendanceHistoryController = catchAsync(
  async (req: Request, res: Response) => {
    const search = req.query.search as string;
    const attendance = await fetchEmployeeAttendanceHistory(search);
    if (attendance.success) {
      useSuccessResponse(
        res,
        "Employee attendance history fetched successfully",
        attendance.data,
        200
      );
    } else {
      useErrorResponse(res, attendance.message, attendance.statusCode);
    }
  }
);
