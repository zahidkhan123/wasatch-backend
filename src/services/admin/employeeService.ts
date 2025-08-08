import { Employee, IEmployee } from "../../models/employee/employee.model.js";
import { FilterQuery } from "mongoose";
import dayjs from "dayjs";
import { Attendance } from "../../models/employee/attendance.js";
import { Task } from "../../models/admin/task.model.js";

export const getEmployeesService = async (filters: {
  query?: "on_duty" | "off_duty" | "late" | "all";
}): Promise<any> => {
  console.log(filters);
  try {
    const query: FilterQuery<IEmployee> = {};

    // If dutyStatus is "all", show all employees (no filter on status)
    if (filters.query === "all" || !filters.query) {
      // Do not add any status filter, fetch all employees
    } else if (
      filters.query === "on_duty" ||
      filters.query === "off_duty" ||
      filters.query === "late"
    ) {
      query["status"] = filters.query;
    }

    // Fetch employees and also return the property they are assigned to
    const employees = await Employee.find(query)
      .select("-__v -password -updatedAt -createdAt -role -active")
      .populate({
        path: "assignedArea",
        select: "name propertyId", // Select property name and propertyId
      })
      .sort({ createdAt: -1 });

    return {
      success: true,
      message: "Employees fetched successfully",
      statusCode: 200,
      data: employees,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Failed to fetch employees",
      statusCode: 500,
      data: null,
      error: error instanceof Error ? error.message : error,
    };
  }
};
export const getEmployeeByIdService = async (employeeId: string) => {
  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return {
        success: false,
        message: "Employee not found",
        statusCode: 404,
      };
    }

    // Get today's date range
    const todayStart = dayjs().startOf("day").toDate();
    const todayEnd = dayjs().endOf("day").toDate();

    // Fetch today's attendance
    const todayAttendance = await Attendance.findOne({
      employeeId,
      shiftDate: { $gte: todayStart, $lte: todayEnd },
    }).populate("propertyVisits.propertyId");

    // Determine last known location (last entry in propertyVisits)
    const lastVisit =
      todayAttendance?.propertyVisits?.[
        todayAttendance.propertyVisits.length - 1
      ];

    const lastKnownLocation = lastVisit?.propertyId || null;
    const clockIn = todayAttendance?.clockIn || null;
    const clockOut = todayAttendance?.clockOut || null;

    // Get today's tasks assigned to this employee
    const todaysTasks = await Task.find({
      assignedEmployees: employee._id,
      scheduledStart: { $gte: todayStart, $lte: todayEnd },
    });

    const totalTasksToday = todaysTasks.length;
    const pendingTasks = todaysTasks.filter(
      (t) => t.status === "pending"
    ).length;
    const onDemandTasks = todaysTasks.filter(
      (t: any) => t.type === "on_demand"
    ).length;
    console.log(employee._id);
    // Get 3 most recent completed tasks
    const recentTasks = await Task.find({
      employeeId: employee._id,
      status: "completed",
    })
      .sort({ updatedAt: -1 })
      .limit(3);

    console.log("recentTasks", recentTasks);
    return {
      success: true,
      message: "Employee data fetched successfully",
      statusCode: 200,
      data: {
        _id: employee._id,
        fullName: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        phone: employee.phone,
        status: employee.status,
        shift: {
          start: employee.shiftStart,
          end: employee.shiftEnd,
        },
        attendance: {
          lastKnownLocation,
          clockIn,
          clockOut,
        },
        todayTaskSummary: {
          totalTasks: totalTasksToday,
          pendingTasks,
          onDemandTasks,
        },
        recentTasks: recentTasks.map((task: any) => ({
          unitNumber: task.unitNumber,
          buildingName: task.buildingName,
          apartmentName: task.apartmentName,
          completedAt: task?.actualEnd || task?.updatedAt,
          createdAt: task?.createdAt,
        })),
      },
    };
  } catch (err: any) {
    console.error("Error fetching employee data:", err);
    return {
      success: false,
      message: "Failed to fetch employee data",
      statusCode: 500,
    };
  }
};
