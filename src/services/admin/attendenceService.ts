import dayjs from "dayjs";
import { Attendance } from "../../models/employee/attendance.js";
import { Employee } from "../../models/employee/employee.model.js";
import { Types } from "mongoose";

// Helper: Format hours
function calculateDuration(start: Date, end: Date): string {
  const diff = dayjs(end).diff(dayjs(start), "minute");
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${hours}h ${minutes}`;
}

// This function fetches daily attendance. To get attendance by employee ID, simply pass the employeeId in the filters.
// Example usage: fetchDailyAttendance({ employeeId: "EMPLOYEE_OBJECT_ID" })

export const fetchDailyAttendance = async (filters: {
  date?: string;
  name?: string;
  employeeId?: string;
}) => {
  try {
    const matchQuery: any = {};

    // If employeeId is provided, filter by employeeId
    if (filters.employeeId) {
      matchQuery.employeeId = new Types.ObjectId(filters.employeeId);
    }

    // Date filter (default: today)
    const targetDate = filters.date ? dayjs(filters.date) : dayjs();
    const shiftDateStart = targetDate.startOf("day").toDate();
    const shiftDateEnd = targetDate.endOf("day").toDate();

    if (filters.date) {
      matchQuery.shiftDate = {
        $gte: shiftDateStart,
        $lt: shiftDateEnd,
      };
    }
    // Fetch attendance logs for the given filters
    let attendanceLogs = await Attendance.find(matchQuery)
      .select("employeeId clockIn clockOut status shiftDate")
      .populate("employeeId", "firstName lastName")
      .lean();

    // If name filter is provided, filter by employee's full name
    if (filters.name) {
      const searchName = filters.name.toLowerCase();
      attendanceLogs = attendanceLogs.filter((log: any) => {
        const fullName =
          `${log.employeeId.firstName} ${log.employeeId.lastName}`.toLowerCase();
        return fullName.includes(searchName);
      });
    }

    // Format the response
    const formatted = attendanceLogs.map((log: any) => ({
      name: `${log.employeeId.firstName} ${log.employeeId.lastName}`,
      clockIn: log.clockIn ? dayjs(log.clockIn).format("hh:mm A") : "—",
      clockOut: log.clockOut ? dayjs(log.clockOut).format("hh:mm A") : "—",
      status: log.status || "Absent",
      totalHours:
        log.clockIn && log.clockOut
          ? calculateDuration(log.clockIn, log.clockOut)
          : "0h",
    }));

    return {
      success: true,
      message: "Daily attendance fetched successfully",
      statusCode: 200,
      data: formatted,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to fetch daily attendance",
      statusCode: 500,
      error: error.message,
    };
  }
};

/*
English: 
To get attendance by employee ID, call this function with the employeeId in the filters object, e.g.:
await fetchDailyAttendance({ employeeId: "EMPLOYEE_OBJECT_ID" });

Urdu:
کسی خاص ملازم کی حاضری حاصل کرنے کے لیے، اس فنکشن کو employeeId کے ساتھ filters میں کال کریں، مثلاً:
await fetchDailyAttendance({ employeeId: "EMPLOYEE_OBJECT_ID" });
*/

// 2. Daily With Hours (for second screen)
export const fetchDailyAttendanceWithHours = async (date: string) => {
  try {
    const shiftDate = dayjs(date).startOf("day").toDate();

    const attendanceLogs = await Attendance.find({ shiftDate })
      .populate("employeeId", "firstName lastName")
      .lean();

    const formatted = attendanceLogs.map((log: any) => ({
      name: `${log.employeeId.firstName} ${log.employeeId.lastName}`,
      clockIn: log.clockIn ? dayjs(log.clockIn).format("hh:mm A") : "—",
      clockOut: log.clockOut ? dayjs(log.clockOut).format("hh:mm A") : "—",
      status: log.status || "Absent",
      totalHours:
        log.clockIn && log.clockOut
          ? calculateDuration(log.clockIn, log.clockOut)
          : "0h",
    }));

    return {
      success: true,
      message: "Daily attendance with hours fetched successfully",
      statusCode: 200,
      data: formatted,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to fetch attendance with hours",
      statusCode: 500,
      error: error.message,
    };
  }
};

// 3. Employee Attendance History (search by name or ID)
export const fetchEmployeeAttendanceHistory = async (search: string) => {
  try {
    const employees = await Employee.find({
      $or: [
        { firstName: new RegExp(search, "i") },
        { lastName: new RegExp(search, "i") },
        { employeeId: new RegExp(search, "i") },
      ],
    }).lean();

    const employeeIds = employees.map((e) => e._id);

    const logs = await Attendance.find({
      employeeId: { $in: employeeIds },
    })
      .sort({ shiftDate: -1 })
      .lean();

    const grouped = logs.map((log: any) => {
      const emp = employees.find(
        (e) => e._id.toString() === log.employeeId.toString()
      );
      return {
        name: `${emp?.firstName} ${emp?.lastName}`,
        date: dayjs(log.shiftDate).format("MMMM D, YYYY"),
        clockIn: log.clockIn ? dayjs(log.clockIn).format("hh:mm A") : "—",
      };
    });

    return {
      success: true,
      message: "Employee attendance history fetched successfully",
      statusCode: 200,
      data: grouped,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to fetch employee history",
      statusCode: 500,
      error: error.message,
    };
  }
};
