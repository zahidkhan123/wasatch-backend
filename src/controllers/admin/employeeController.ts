import { Request, Response } from "express";
import * as employeeService from "../../services/admin/employeeService.js";
import {
  useErrorResponse,
  useSuccessResponse,
} from "../../utils/apiResponse.js";
import { catchAsync } from "../../utils/catch-async.js";

export const getEmployees = catchAsync(async (req: Request, res: Response) => {
  const employees = await employeeService.getEmployeesService(req.query as any);
  if (employees.success) {
    useSuccessResponse(
      res,
      employees.message,
      employees.data,
      employees.statusCode
    );
  } else {
    useErrorResponse(res, employees.message, employees.statusCode);
  }
});

export const getEmployeeById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeByIdService(id);

    if (employee.success) {
      useSuccessResponse(
        res,
        employee.message,
        employee.data,
        employee.statusCode
      );
    } else {
      useErrorResponse(res, employee.message, employee.statusCode);
    }
  }
);
