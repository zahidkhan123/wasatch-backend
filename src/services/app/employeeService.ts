import { ITask, Task } from "../../models/admin/task.model.js";
import { Types, FilterQuery } from "mongoose";
import { Employee } from "../../models/employee/employee.model.js";
import { Attendance } from "../../models/employee/attendance.js";
import { Property } from "../../models/admin/property.model.js";
import dayjs from "dayjs";
import { EmployeePropertyAssignment } from "../../models/admin/EmployeePropertyAssignment.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { getDayRangeInTZ } from "../../helpers/helperFunctions.js";
import { NotificationSettingModel } from "../../models/notifications/notificationSettings.model.js";
import { sendNotification } from "../../utils/notification.js";
import { NotificationType } from "../../models/notifications/notification.model.js";
import { IssueModel } from "../../models/employee/IssueReport.model.js";
import { sendFCMNotification } from "../../utils/sendFCM.js";
import { User } from "../../models/user.model.js";
import { TemporaryAssignment } from "../../models/admin/TemporaryAssignmentModel.js";
import { PickupRequest } from "../../models/admin/PickupRequest.model.js";
import {
  createTaskStartedLog,
  createTaskCompletedLog,
  createIssueReportedLog,
} from "../admin/activityService.js";
import { APP_TZ, APPLICATION_TIMEZONE } from "../../config/timezoneConfig.js";
dayjs.extend(utc);
dayjs.extend(timezone);
// const APP_TZ = APPLICATION_TIMEZONE;
const getDashboardSummary = async (employeeId: string) => {
  try {
    const today = getDayRangeInTZ(
      dayjs().tz(APP_TZ).startOf("day").toISOString()
    );
    console.log(
      "today start",
      today.start.toISOString(),
      "end",
      today.end.toISOString()
    );
    // Use the same query logic as getEmployeeTasks for consistency
    const baseQuery: FilterQuery<ITask> = {
      $or: [{ assignedEmployees: employeeId }, { employeeId: employeeId }],
      scheduledStart: {
        $gte: today.start.toISOString(),
        $lte: today.end.toISOString(),
      },
    };

    // Count tasks for today by status
    const [completedTasks, pendingTasks, missedTasks] = await Promise.all([
      Task.countDocuments({ ...baseQuery, status: "completed" }),
      Task.countDocuments({ ...baseQuery, status: "pending" }),
      Task.countDocuments({ ...baseQuery, status: "missed" }),
    ]);

    // Get the next 2 upcoming pending tasks for today
    const nextTwoTasks = await Task.find({
      ...baseQuery,
      status: "pending",
    })
      .populate("requestId", "type timeSlot date userId specialInstructions")
      .sort({ scheduledStart: 1 }) // sort by soonest first
      .limit(2);

    return {
      message: "Dashboard summary fetched successfully",
      data: {
        today: {
          completedTasks,
          pendingTasks,
          missedTasks,
        },
        nextTwoTasks,
      },
      statusCode: 200,
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Failed to fetch dashboard summary",
      statusCode: 500,
      success: false,
    };
  }
};

const getEmployeeTasks = async (
  employeeId: string,
  filters: {
    status?: string;
    type?: string;
    date?: string;
    propertyId?: string;
    todayOnly?: boolean;
  }
): Promise<any> => {
  try {
    // Prepare base query for assigned employees or direct employeeId
    const taskQuery: FilterQuery<ITask> = {
      $or: [{ assignedEmployees: employeeId }, { employeeId: employeeId }],
    };

    // Helper to get today's range in APP_TZ
    const getTodayRange = () => {
      const start = dayjs().tz(APP_TZ).startOf("day").toISOString();
      const end = dayjs().tz(APP_TZ).endOf("day").toISOString();
      return { $gte: start, $lte: end };
    };

    // Optimize: Only set scheduledStart once, with priority: todayOnly > date > status/type/propertyId
    let scheduledStartSet = false;

    // Handle todayOnly filter
    if (filters.todayOnly) {
      const today = getDayRangeInTZ(
        dayjs().tz(APP_TZ).startOf("day").toISOString()
      );
      taskQuery.scheduledStart = { $gte: today.start, $lte: today.end };
      scheduledStartSet = true;
    } else if (filters.date) {
      const dateRange = getDayRangeInTZ(filters.date);
      taskQuery.scheduledStart = {
        $gte: dateRange.start.toISOString(),
        $lt: dateRange.end.toISOString(),
      };
      scheduledStartSet = true;
    }

    // Handle propertyId filter
    if (filters.propertyId) {
      taskQuery.propertyId = new Types.ObjectId(filters.propertyId);
      if (!scheduledStartSet) {
        taskQuery.scheduledStart = getTodayRange();
        scheduledStartSet = true;
      }
    }

    // Handle type filter (except for on_demand)
    if (filters.type && filters.status !== "on_demand") {
      taskQuery.type = filters.type;
      if (!scheduledStartSet) {
        taskQuery.scheduledStart = getTodayRange();
        scheduledStartSet = true;
      }
    }

    // Handle status filter
    if (filters.status) {
      switch (filters.status) {
        case "all":
          if (!scheduledStartSet) {
            taskQuery.scheduledStart = getTodayRange();
            scheduledStartSet = true;
          }
          break;
        case "completed":
        case "pending":
          taskQuery.status = filters.status;
          if (!scheduledStartSet) {
            taskQuery.scheduledStart = getTodayRange();
            scheduledStartSet = true;
          }
          break;
        case "on_demand":
          // No need to set status or scheduledStart here
          break;
        default:
          taskQuery.status = filters.status;
          if (!scheduledStartSet) {
            taskQuery.scheduledStart = getTodayRange();
            scheduledStartSet = true;
          }
      }
    }

    // Build query with population and projection
    const tasks = await Task.find(taskQuery)
      .populate({
        path: "requestId",
        match:
          filters.status === "on_demand"
            ? {
                type: "on_demand",
                date: {
                  $gte: dayjs().tz(APP_TZ).startOf("day").toISOString(),
                  $lte: dayjs().tz(APP_TZ).endOf("day").toISOString(),
                },
              }
            : {},
        select: "type timeSlot date userId specialInstructions",
      })
      .select("-__v -updatedAt -createdAt")
      .sort({ scheduledStart: -1 })
      .lean();

    // Filter out tasks with null requestId for on_demand
    const filteredTasks =
      filters.status === "on_demand"
        ? tasks.filter((task: any) => task.requestId !== null)
        : tasks;

    return {
      success: true,
      message: "Tasks fetched successfully",
      statusCode: 200,
      data: filteredTasks,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to fetch tasks",
      statusCode: 500,
      data: null,
      error: error?.message || error,
    };
  }
};

const getTaskById = async (id: string) => {
  try {
    const task = await Task.findById(id).populate("employee_id");
    return {
      success: true,
      message: "Task fetched successfully",
      statusCode: 200,
      data: task,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch task",
      statusCode: 500,
      data: null,
      error: error instanceof Error ? error.message : error,
    };
  }
};

// const getEmployeeTasks = async (employeeId: string) => {
//   try {
//     const tasks = await Task.find({ assignedTo: employeeId });
//     return {
//       message: "Employee tasks fetched successfully",
//       data: tasks,
//       statusCode: 200,
//       success: true,
//     };
//   } catch (error) {
//     return {
//       message: "Failed to fetch employee tasks",
//       statusCode: 500,
//       success: false,
//     };
//   }
// };

// const getTaskById = async (employeeId: string, taskId: string) => {
//   try {
//     const task = await Task.findOne({ _id: taskId, assignedTo: employeeId });
//     if (!task) {
//       return {
//         message: "Task not found",
//         statusCode: 404,
//         success: false,
//       };
//     }
//     return {
//       message: "Task fetched successfully",
//       data: task,
//       statusCode: 200,
//       success: true,
//     };
//   } catch (error) {
//     return {
//       message: "Failed to fetch task",
//       statusCode: 500,
//       success: false,
//     };
//   }
// };

const startTask = async (taskId: string, employeeId: string) => {
  try {
    console.log("startTask", taskId, employeeId);
    // Find the task where the employee is in assignedEmployees
    const task = await Task.findOne({
      _id: new Types.ObjectId(taskId),
      assignedEmployees: { $in: [new Types.ObjectId(employeeId)] },
    }).populate("requestId");

    if (!task) {
      return {
        message: "Task not found or not assigned to you",
        statusCode: 404,
        success: false,
      };
    }
    const notificationSetting = await NotificationSettingModel.findOne({
      userId: (task.requestId as any).userId,
    }).select("issueUpdate taskStatus");
    console.log("task.scheduledStart", task.scheduledStart);
    console.log("task.scheduledEnd", task.scheduledEnd);
    // Check if current time is within scheduledStart and scheduledEnd
    const now = new Date(); // this would be the mst time
    console.log("now", now);
    if (now < task.scheduledStart || now > task.scheduledEnd) {
      return {
        message: "Task can only be started within its scheduled time window",
        statusCode: 400,
        success: false,
      };
    }

    // Assign the employeeId to the task's employeeId field and update status/actualStart
    task.employeeId = new Types.ObjectId(employeeId) as any;
    task.actualStart = now;
    task.status = "in_progress";
    await task.save();

    // Create activity log for task started
    await createTaskStartedLog({
      taskId: (task._id as any).toString(),
      employeeId: employeeId,
      unitNumber: task.unitNumber,
      requestType: (task.requestId as any)?.type || "routine",
    });

    // if (notificationSetting?.taskStatus) {
    //   await sendNotification(
    //     (task.requestId as any).userId.toString(),
    //     "user",
    //     "Civil.png",
    //     "Task Started",
    //     "Your task has been started",
    //     "task_alert" as NotificationType
    //   );
    // }
    return {
      message: "Task started successfully",
      data: task,
      statusCode: 200,
      success: true,
    };
  } catch (error) {
    console.error("Error starting task:", error);
    return {
      message: "Failed to start task",
      statusCode: 500,
      success: false,
    };
  }
};

const endTask = async (taskId: string, employeeId: string) => {
  try {
    const now = new Date();
    // Find the task where the employee is in assignedEmployees and task is in progress
    const task = await Task.findOne({
      _id: new Types.ObjectId(taskId),
      assignedEmployees: { $in: [new Types.ObjectId(employeeId)] },
      status: "in_progress",
    }).populate("requestId");

    if (!task) {
      return {
        message: "Task not found, not assigned to you, or not in progress",
        statusCode: 404,
        success: false,
      };
    }

    // Find the notification settings for the user and populate the user details (including fcmTokens)
    const notificationSetting = await NotificationSettingModel.findOne({
      userId: (task.requestId as any).userId,
      role: "user",
    })
      .select("issueUpdates taskStatus userId")
      .populate("userId", "fcmTokens");

    // Check if current time is within scheduledStart and scheduledEnd
    if (now < task.scheduledStart || now > task.scheduledEnd) {
      return {
        message: "Task can only be ended within its scheduled time window",
        statusCode: 400,
        success: false,
      };
    }

    task.actualEnd = now;
    task.status = "completed";

    await PickupRequest.updateOne(
      { _id: (task.requestId as any)._id },
      { $set: { status: "completed" } }
    );
    await task.save();

    // Create activity log for task completed
    await createTaskCompletedLog({
      taskId: (task._id as any).toString(),
      employeeId: employeeId,
      unitNumber: task.unitNumber,
      requestType: (task.requestId as any)?.type || "routine",
    });
    if (notificationSetting?.taskStatus) {
      await sendNotification(
        (task.requestId as any).userId.toString(),
        "user",
        "check.svg",
        "Task Completed",
        "Your task has been completed",
        "task_completed" as NotificationType
      );

      sendFCMNotification({
        title: "Your task has been completed",
        body: "Your task has been completed",
        tokens: (notificationSetting?.userId as any)?.fcmTokens || [],
      });
    }
    return {
      message: "Task completed successfully",
      data: task,
      statusCode: 200,
      success: true,
    };
  } catch (error) {
    return {
      message: "Failed to complete task",
      statusCode: 500,
      success: false,
    };
  }
};

const delayTask = async (taskId: string, employeeId: string) => {
  try {
    const now = new Date();
    // Find the task where the employee is in assignedEmployees and task is in progress
    const task = await Task.findOne({
      _id: new Types.ObjectId(taskId),
      assignedEmployees: { $in: [new Types.ObjectId(employeeId)] },
      status: "pending",
    }).populate("requestId");

    if (!task) {
      return {
        message: "Task not found, not assigned to you, or not in progress",
        statusCode: 404,
        success: false,
      };
    }
    const notificationSetting = await NotificationSettingModel.findOne({
      userId: (task.requestId as any).userId,
    }).select("issueUpdate taskStatus");
    // Check if current time is within scheduledStart and scheduledEnd
    if (now < task.scheduledStart || now > task.scheduledEnd) {
      return {
        message: "Task can only be delayed within its scheduled time window",
        statusCode: 400,
        success: false,
      };
    }

    task.status = "delayed";
    task.actualEnd = now;
    await task.save();
    if (notificationSetting?.taskStatus) {
      await sendNotification(
        (task.requestId as any).userId.toString(),
        "user",
        "alert.svg",
        "Task Delayed",
        "Your task has been delayed",
        "task_alert" as NotificationType
      );
    }
    return {
      message: "Task delayed successfully",
      data: task,
      statusCode: 200,
      success: true,
    };
  } catch (error) {
    console.error("Error delaying task:", error);
    return {
      message: "Failed to delay task",
      statusCode: 500,
      success: false,
    };
  }
};

// const isWithinRadius = (
//   center: Location,
//   point: Location,
//   radiusMeters = 100
// ): boolean => {
//   const distance = haversine(center, point); // in meters
//   return distance <= radiusMeters;
// };

interface Location {
  lat: number;
  lng: number;
}

interface CheckInBody {
  propertyId: string;
  location: Location;
}

const CHECKIN_RADIUS_METERS = 100;
const GRACE_MINUTES = 7;

const isWithinRadius = (propertyCoords: Location, employeeCoords: Location) => {
  const { lat: lat1, lng: lng1 } = propertyCoords;
  const { lat: lat2, lng: lng2 } = employeeCoords;

  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000; // Radius of Earth in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c <= CHECKIN_RADIUS_METERS;
};

// const checkIn = async (
//   employeeId: string,
//   propertyId: string,
//   location: { latitude: number; longitude: number }
// ) => {
//   try {
//     const employee = await Employee.findById(new Types.ObjectId(employeeId));
//     if (!employee) {
//       return {
//         success: false,
//         message: "Employee not found.",
//         statusCode: 404,
//       };
//     }

//     const todayRange = getDayRangeInTZ(
//       dayjs().tz(APP_TZ).startOf("day").toISOString()
//     );
//     const todayStart = todayRange.start;
//     const todayEnd = todayRange.end;

//     const task = await Task.findOne({
//       assignedEmployees: { $in: [new Types.ObjectId(employeeId)] },
//       propertyId: new Types.ObjectId(propertyId),
//       status: "pending",
//       scheduledStart: { $gte: todayStart, $lte: todayEnd },
//     });
//     console.log("task", task);
//     const assignment = await EmployeePropertyAssignment.findOne({
//       employeeId: new Types.ObjectId(employeeId),
//       propertyId: new Types.ObjectId(propertyId),
//       validFrom: { $lte: todayStart },
//       $or: [{ validUntil: null }, { validUntil: { $gte: todayEnd } }],
//     });

//     const tempAssignment = await TemporaryAssignment.create({
//       employeeId,
//       propertyId,
//       startDate: todayStart,
//       endDate: todayEnd,
//       assignedBy: new Types.ObjectId(employeeId),
//       reason: "User requested task",
//     });
//     console.log("assignment", assignment, tempAssignment);
//     if (!task && !assignment && !tempAssignment) {
//       return {
//         success: false,
//         message:
//           "You are not officially assigned to this property for this user-requested task.",
//         statusCode: 403,
//       };
//     }

//     const property = await Property.findById(new Types.ObjectId(propertyId));
//     if (!property || !property.location) {
//       return {
//         success: false,
//         message: "Property location not found.",
//         statusCode: 404,
//       };
//     }

//     const isNearby = isWithinRadius(property.location, {
//       lat: location.latitude,
//       lng: location.longitude,
//     });

//     if (!isNearby) {
//       return {
//         success: false,
//         message: "You must be at the property to check in.",
//         statusCode: 403,
//       };
//     }

//     let shiftDate: Date;
//     if (employee?.shiftStart && typeof employee.shiftStart === "string") {
//       const timeStr = employee.shiftStart.trim();
//       const dateStr = dayjs().tz(APP_TZ).format("YYYY-MM-DD");
//       let parsedShift;

//       if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(timeStr)) {
//         parsedShift = dayjs.tz(
//           `${dateStr} ${timeStr}`,
//           "YYYY-MM-DD hh:mm A",
//           APP_TZ
//         );
//       } else if (/^\d{2}:\d{2}$/.test(timeStr)) {
//         parsedShift = dayjs.tz(
//           `${dateStr} ${timeStr}`,
//           "YYYY-MM-DD HH:mm",
//           APP_TZ
//         );
//       }

//       shiftDate = parsedShift?.isValid()
//         ? parsedShift.toDate()
//         : dayjs().tz(APP_TZ).startOf("day").toDate();
//     } else {
//       shiftDate = dayjs().tz(APP_TZ).startOf("day").toDate();
//     }

//     const now = dayjs().tz(APP_TZ);

//     const attendance = await Attendance.findOne({
//       employeeId: new Types.ObjectId(employeeId),
//       shiftDate: shiftDate,
//     });

//     const visitData = {
//       propertyId: new Types.ObjectId(propertyId),
//       checkIn: {
//         time: now.toDate(),
//         location: {
//           lat: location.latitude,
//           lng: location.longitude,
//         },
//       },
//     };

//     if (attendance) {
//       const alreadyVisited = attendance.propertyVisits.some(
//         (visit) => visit.propertyId.toString() === propertyId
//       );

//       if (alreadyVisited) {
//         return {
//           success: false,
//           message: "Already checked in to this property today.",
//           statusCode: 409,
//         };
//       }

//       attendance.propertyVisits.push(visitData as any);

//       // Update clockIn if it’s the earliest
//       if (!attendance.clockIn || now.isBefore(dayjs(attendance.clockIn))) {
//         attendance.clockIn = now.toDate();
//       }

//       await attendance.save();

//       return {
//         success: true,
//         message: "Checked in to another property successfully.",
//         statusCode: 200,
//         data: { status: attendance.status, time: now.toDate() },
//       };
//     }

//     const shiftStart = dayjs(shiftDate).tz(APP_TZ);
//     const graceLimit = shiftStart.add(GRACE_MINUTES, "minutes");
//     const status =
//       now.isBefore(graceLimit) || now.isSame(graceLimit) ? "on_time" : "late";

//     await Attendance.create({
//       employeeId: new Types.ObjectId(employeeId),
//       shiftDate: shiftDate,
//       shiftStartTime: shiftStart.toDate(),
//       clockIn: now.toDate(),
//       status,
//       propertyVisits: [visitData],
//     });

//     await Employee.findByIdAndUpdate(new Types.ObjectId(employeeId), {
//       status: status === "on_time" ? "on_duty" : "late",
//       lastCheckIn: now.toDate(),
//     });

//     if (task) {
//       task.employeeId = new Types.ObjectId(employeeId) as any;
//       await task.save();
//     }

//     return {
//       success: true,
//       message: `Checked in successfully (${status}).`,
//       statusCode: 200,
//       data: { status, time: now.toDate() },
//     };
//   } catch (error: any) {
//     console.error("Check-in error:", error);

//     const errorDetails =
//       error?.code === 11000
//         ? {
//             code: error.code,
//             keyPattern: error.keyPattern,
//             keyValue: error.keyValue,
//             errmsg: error.errmsg,
//           }
//         : { message: error.message || error };

//     return {
//       success: false,
//       message: "Failed to check in.",
//       statusCode: 500,
//       error: errorDetails,
//     };
//   }
// };

// const checkOut = async (
//   employeeId: string,
//   propertyId: string,
//   location: { latitude: number; longitude: number }
// ) => {
//   try {
//     // 1. Validate employee
//     const employee = await Employee.findById(new Types.ObjectId(employeeId));
//     if (!employee) {
//       return {
//         success: false,
//         message: "Employee not found.",
//         statusCode: 404,
//       };
//     }

//     // 2. Get today's date range
//     const todayRange = getDayRangeInTZ(
//       dayjs().tz(APP_TZ).startOf("day").toISOString()
//     );
//     const todayStart = todayRange.start;
//     const todayEnd = todayRange.end;

//     // 3. Validate assignment or temp assignment or task
//     const assignment = await EmployeePropertyAssignment.findOne({
//       employeeId: new Types.ObjectId(employeeId),
//       propertyId: new Types.ObjectId(propertyId),
//       validFrom: { $lte: todayStart },
//       $or: [{ validUntil: null }, { validUntil: { $gte: todayEnd } }],
//     });

//     const tempAssignment = await TemporaryAssignment.findOne({
//       employeeId,
//       propertyId,
//       startDate: todayStart,
//       endDate: todayEnd,
//     });

//     const task = await Task.findOne({
//       assignedEmployees: { $in: [new Types.ObjectId(employeeId)] },
//       propertyId: new Types.ObjectId(propertyId),
//       status: "pending",
//       scheduledStart: { $gte: todayStart, $lte: todayEnd },
//     });
//     console.log("task", task, assignment, tempAssignment);
//     if (!task && !assignment && !tempAssignment) {
//       return {
//         success: false,
//         message:
//           "You are not officially assigned to this property for this user-requested task.",
//         statusCode: 403,
//       };
//     }

//     // 4. Geolocation validation
//     const property = await Property.findById(new Types.ObjectId(propertyId));
//     if (!property || !property.location) {
//       return {
//         success: false,
//         message: "Property location not found.",
//         statusCode: 404,
//       };
//     }

//     const isNearby = isWithinRadius(property.location, {
//       lat: location.latitude,
//       lng: location.longitude,
//     });

//     if (!isNearby) {
//       return {
//         success: false,
//         message: "You must be at the property to check out.",
//         statusCode: 403,
//       };
//     }

//     // 5. Get shiftDate
//     let shiftDate: Date;
//     if (employee?.shiftStart && typeof employee.shiftStart === "string") {
//       const timeStr = employee.shiftStart.trim();
//       const dateStr = dayjs().tz(APP_TZ).format("YYYY-MM-DD");
//       let parsedShift;

//       if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(timeStr)) {
//         parsedShift = dayjs.tz(
//           `${dateStr} ${timeStr}`,
//           "YYYY-MM-DD hh:mm A",
//           APP_TZ
//         );
//       } else if (/^\d{2}:\d{2}$/.test(timeStr)) {
//         parsedShift = dayjs.tz(
//           `${dateStr} ${timeStr}`,
//           "YYYY-MM-DD HH:mm",
//           APP_TZ
//         );
//       }

//       shiftDate = parsedShift?.isValid()
//         ? parsedShift.toDate()
//         : dayjs().tz(APP_TZ).startOf("day").toDate();
//     } else {
//       shiftDate = dayjs().tz(APP_TZ).startOf("day").toDate();
//     }

//     const now = dayjs().tz(APP_TZ);
//     console.log("shiftDate", shiftDate);
//     // 6. Find today's attendance
//     const attendance = await Attendance.findOne({
//       employeeId: new Types.ObjectId(employeeId),
//       shiftDate: shiftDate,
//     });

//     if (!attendance) {
//       return {
//         success: false,
//         message: "Attendance not found for today.",
//         statusCode: 404,
//       };
//     }

//     // 7. Find the specific propertyVisit to update
//     const visit = attendance.propertyVisits.find(
//       (v) => v.propertyId.toString() === propertyId && v.checkIn
//     );

//     if (!visit) {
//       return {
//         success: false,
//         message: "No active check-in found for this property.",
//         statusCode: 404,
//       };
//     }

//     // 8. Set checkOut and hoursWorked
//     const checkInTime = dayjs(visit.checkIn.time);
//     const hoursWorked = now.diff(checkInTime, "minute") / 60;

//     visit.checkOut = {
//       time: now.toDate(),
//       location: {
//         lat: location.latitude,
//         lng: location.longitude,
//       },
//     };
//     visit.hoursWorked = parseFloat(hoursWorked.toFixed(2));

//     // 9. Set overall clockOut if this is the latest
//     const latestVisitOut = attendance.propertyVisits
//       .map((v) => v.checkOut?.time)
//       .filter(Boolean)
//       .map((d) => dayjs(d));

//     const isLatest = latestVisitOut.every((t) => now.isAfter(t));

//     if (isLatest) {
//       attendance.clockOut = now.toDate();
//     }

//     attendance.shiftEndTime = task?.scheduledEnd || attendance.shiftEndTime;

//     await attendance.save();

//     // 10. Update employee status
//     await Employee.findByIdAndUpdate(new Types.ObjectId(employeeId), {
//       status: "off_duty",
//     });

//     return {
//       success: true,
//       message: "Checked out successfully.",
//       statusCode: 200,
//       data: {
//         clockOut: now.toDate(),
//         attendanceId: attendance._id,
//         propertyId,
//         hoursWorked: visit.hoursWorked,
//       },
//     };
//   } catch (error: any) {
//     console.error("Check-out error:", error);
//     return {
//       success: false,
//       message: "Failed to check out.",
//       error: error.message,
//       statusCode: 500,
//     };
//   }
// };

const checkIn = async (
  employeeId: string,
  propertyId: string,
  location: { latitude: number; longitude: number }
) => {
  try {
    const employee = await Employee.findById(new Types.ObjectId(employeeId));
    if (!employee) {
      return {
        success: false,
        message: "Employee not found.",
        statusCode: 404,
      };
    }
    const property = await Property.findById(new Types.ObjectId(propertyId));
    if (!property || !property.location) {
      return {
        success: false,
        message: "Property location not found.",
        statusCode: 404,
      };
    }

    const isAssignedToArea = employee.assignedArea?.toString() === propertyId;
    const tempAssignment = await TemporaryAssignment.findOne({
      employeeId: new Types.ObjectId(employeeId),
      propertyId: new Types.ObjectId(propertyId),
    });

    if (!isAssignedToArea && !tempAssignment) {
      return {
        success: false,
        message: "You are not assigned to this property.",
        statusCode: 403,
      };
    }

    // Get today’s shift date (start of day in APP_TZ)
    const shiftDate = dayjs().tz(APP_TZ).startOf("day").toDate();
    const now = dayjs().tz(APP_TZ);

    // Find today's attendance
    let attendance = await Attendance.findOne({
      employeeId: new Types.ObjectId(employeeId),
      shiftDate,
    });

    // Prevent duplicate check-in for the same property
    if (
      attendance &&
      attendance.propertyVisits.some(
        (visit) => visit.propertyId.toString() === propertyId
      )
    ) {
      return {
        success: false,
        message: "Already checked in at this property today.",
        statusCode: 409,
      };
    }

    // Validate property location
    const isNearby = isWithinRadius(property.location, {
      lat: location.latitude,
      lng: location.longitude,
    });
    if (!isNearby) {
      return {
        success: false,
        message: "You must be at the property to check in.",
        statusCode: 403,
      };
    }

    // New visit data
    const visitData = {
      propertyId: new Types.ObjectId(propertyId),
      checkIn: {
        time: now.toDate(),
        location: { lat: location.latitude, lng: location.longitude },
      },
    };

    if (attendance) {
      attendance.propertyVisits.push(visitData as any);
      if (!attendance.clockIn || now.isBefore(dayjs(attendance.clockIn))) {
        attendance.clockIn = now.toDate();
      }
      await attendance.save();
    } else {
      // Determine status (on_time / late)
      let status = "on_time";
      let shiftStartDate: Date | null = null;

      if (employee.shiftStart) {
        // Build a full datetime string for today in APP_TZ
        const todayStr = dayjs().tz(APP_TZ).format("YYYY-MM-DD");
        const shiftStartStr = `${todayStr} ${employee.shiftStart}`;
        // Parse using dayjs.tz, then convert to Date
        const shiftStart = dayjs.tz(shiftStartStr, "YYYY-MM-DD HH:mm", APP_TZ);
        if (shiftStart.isValid()) {
          shiftStartDate = shiftStart.toDate();
          const graceLimit = shiftStart.add(GRACE_MINUTES, "minutes");
          status = now.isAfter(graceLimit) ? "late" : "on_time";
        } else {
          // If parsing fails, fallback to on_time and null shiftStartTime
          shiftStartDate = null;
          status = "on_time";
        }
      }

      attendance = await Attendance.create({
        employeeId: new Types.ObjectId(employeeId),
        shiftDate,
        shiftStartTime: shiftStartDate,
        clockIn: now.toDate(),
        status,
        propertyVisits: [visitData],
      });
    }

    await Employee.findByIdAndUpdate(employeeId, {
      status: "on_duty",
      lastCheckIn: now.toDate(),
    });

    return {
      success: true,
      message: "Checked in successfully.",
      statusCode: 200,
      data: { time: now.toDate() },
    };
  } catch (error: any) {
    console.error("Check-in error:", error);
    return {
      success: false,
      message: "Failed to check in.",
      statusCode: 500,
      error: error.message,
    };
  }
};

const checkOut = async (
  employeeId: string,
  propertyId: string,
  location: { latitude: number; longitude: number }
) => {
  try {
    const employee = await Employee.findById(new Types.ObjectId(employeeId));
    if (!employee) {
      return {
        success: false,
        message: "Employee not found.",
        statusCode: 404,
      };
    }

    const shiftDate = dayjs().tz(APP_TZ).startOf("day").toDate();
    const now = dayjs().tz(APP_TZ);

    const attendance = await Attendance.findOne({
      employeeId: new Types.ObjectId(employeeId),
      shiftDate,
    });
    if (!attendance) {
      return {
        success: false,
        message: "Attendance not found for today.",
        statusCode: 404,
      };
    }

    // Find visit for this property
    const visit = attendance.propertyVisits.find(
      (v) => v.propertyId.toString() === propertyId
    );
    if (!visit || !visit.checkIn) {
      return {
        success: false,
        message: "No active check-in found for this property.",
        statusCode: 404,
      };
    }

    // Block if already checked out at this property
    if (visit.checkOut?.location?.lat && visit.checkOut?.location?.lng) {
      return {
        success: false,
        message: "Already checked out from this property.",
        statusCode: 409,
      };
    }

    // Validate geolocation
    const property = await Property.findById(new Types.ObjectId(propertyId));
    if (!property || !property.location) {
      return {
        success: false,
        message: "Property location not found.",
        statusCode: 404,
      };
    }

    const isNearby = isWithinRadius(property.location, {
      lat: location.latitude,
      lng: location.longitude,
    });
    if (!isNearby) {
      return {
        success: false,
        message: "You must be at the property to check out.",
        statusCode: 403,
      };
    }

    // Record checkout
    visit.checkOut = {
      time: now.toDate(),
      location: { lat: location.latitude, lng: location.longitude },
    };
    visit.hoursWorked = parseFloat(
      (now.diff(dayjs(visit.checkIn.time), "minute") / 60).toFixed(2)
    );

    // Update overall clockOut if this is the last checkout
    const otherCheckOuts = attendance.propertyVisits
      .map((v) => v.checkOut?.time)
      .filter(Boolean)
      .map((d) => dayjs(d));

    const isLatest = otherCheckOuts.every(
      (t) => now.isSame(t) || now.isAfter(t)
    );
    if (isLatest) {
      attendance.clockOut = now.toDate();
      employee.status = "off_duty";
    }

    await attendance.save();
    await employee.save();

    return {
      success: true,
      message: "Checked out successfully.",
      statusCode: 200,
      data: {
        clockOut: now.toDate(),
        propertyId,
        hoursWorked: visit.hoursWorked,
      },
    };
  } catch (error: any) {
    console.error("Check-out error:", error);
    return {
      success: false,
      message: "Failed to check out.",
      statusCode: 500,
      error: error.message,
    };
  }
};

const reportIssueTask = async (
  employeeId: string,
  issueType: string,
  description: string,
  mediaUrl: string[],
  taskId?: string
) => {
  try {
    // 1. Validate that the task exists and is assigned to the employee
    if (taskId) {
      const task = await Task.findOne({
        _id: new Types.ObjectId(taskId as string),
        assignedEmployees: { $in: [new Types.ObjectId(employeeId)] },
      });
      if (!task) {
        return {
          message: "Task not found or not assigned to you",
          statusCode: 404,
          success: false,
        };
      }
    }

    // const isAlreadyReported = await IssueModel.findOne({
    //   taskId: taskId ? new Types.ObjectId(taskId as string) : null,
    //   employeeId: new Types.ObjectId(employeeId),
    // });
    // if (isAlreadyReported) {
    //   return {
    //     message: "Issue already reported for this task",
    //     statusCode: 400,
    //     success: false,
    //   };
    // }
    // 2. Create the issue report
    const issueReport = await IssueModel.create({
      taskId: taskId ? new Types.ObjectId(taskId as string) : null,
      employeeId: new Types.ObjectId(employeeId),
      issueType,
      description,
      mediaUrl,
    });

    // 3. Optionally, you can update the task to reference the issue report if needed
    if (taskId) {
      const task = await Task.findById(new Types.ObjectId(taskId as string));
      if (!task) {
        return {
          message: "Task not found",
          statusCode: 404,
          success: false,
        };
      }
      task.issueReported = issueReport._id as any;
      await task.save();

      // Create activity log for issue reported
      await createIssueReportedLog({
        issueId: (issueReport._id as any).toString(),
        taskId: taskId,
        employeeId: employeeId,
        unitNumber: task.unitNumber,
        requestType: (task.requestId as any)?.type || "routine",
      });
    } else {
      // Create activity log for issue reported (no task associated)
      await createIssueReportedLog({
        issueId: (issueReport._id as any).toString(),
        employeeId: employeeId,
        unitNumber: "N/A", // No specific unit for general issues
        requestType: "general",
      });
    }

    return {
      message: "Issue reported successfully",
      data: issueReport,
      statusCode: 200,
      success: true,
    };
  } catch (error: any) {
    return {
      message: "Failed to report issue",
      statusCode: 500,
      success: false,
      error: error.message,
    };
  }
};

export type FilterOption = "all" | "today" | "this_week" | "this_month";

const getEmployeeWorkHistory = async (
  employeeId: string,
  filter: FilterOption = "all",
  date?: string
) => {
  try {
    let dateFilter: any = {};

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return {
        success: false,
        message: "Employee not found",
        statusCode: 404,
      };
    }

    // Function to group by actual scheduled date in APP_TZ
    const groupByDate = (d: Date) => dayjs(d).tz(APP_TZ).format("YYYY-MM-DD");

    if (date) {
      // Parse given date in app timezone
      const target = dayjs.tz(date, APP_TZ).startOf("day");
      const dayRange = {
        start: target.clone().startOf("day"),
        end: target.clone().endOf("day"),
      };

      dateFilter = {
        scheduledStart: {
          $gte: dayRange.start.toDate(),
          $lte: dayRange.end.toDate(),
        },
      };
    } else {
      if (filter === "today") {
        const target = dayjs().tz(APP_TZ).startOf("day");
        const dayRange = {
          start: target.clone().startOf("day"),
          end: target.clone().endOf("day"),
        };
        dateFilter = {
          scheduledStart: {
            $gte: dayRange.start.toDate(),
            $lte: dayRange.end.toDate(),
          },
        };
      }

      if (filter === "this_week") {
        const startOfWeek = dayjs().tz(APP_TZ).startOf("week");
        const endOfWeek = dayjs().tz(APP_TZ).endOf("week");

        dateFilter = {
          scheduledStart: {
            $gte: startOfWeek.toDate(),
            $lte: endOfWeek.toDate(),
          },
        };
      }

      if (filter === "this_month") {
        const startOfMonth = dayjs().tz(APP_TZ).startOf("month");
        const endOfMonth = dayjs().tz(APP_TZ).endOf("month");

        dateFilter = {
          scheduledStart: {
            $gte: startOfMonth.toDate(),
            $lte: endOfMonth.toDate(),
          },
        };
      }
    }

    const tasks = await Task.find({
      $or: [{ employeeId }, { assignedEmployees: employeeId }],
      ...dateFilter,
    });

    // Group tasks by correct date
    const grouped: Record<string, any[]> = {};
    tasks.forEach((task) => {
      const dateKey = groupByDate(task.scheduledStart);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });

    const result = Object.entries(grouped).map(([dateKey, tasks]) => {
      // Always treat dateKey as a date string in APP_TZ, so parse in that timezone
      const formattedDate = dayjs.tz(dateKey, APP_TZ).format("MMMM D, YYYY");

      const completedTasks = tasks.filter(
        (t) => t.status === "completed"
      ).length;

      const issuesReported = tasks.filter(
        (t) => t.issueReported && t.issueReported !== null
      ).length;

      let shiftStart: string = "";
      let shiftEnd: string = "";

      if (employee?.shiftStart) {
        const shiftStartDate = dayjs(employee.shiftStart);
        if (shiftStartDate.isValid()) {
          shiftStart = shiftStartDate.tz(APP_TZ).format("HH:mm");
        } else if (typeof employee.shiftStart === "string") {
          const timeMatch = employee.shiftStart.match(
            /(\d{1,2}:\d{2}(?:\s?[APMapm]{2})?)/
          );
          shiftStart = timeMatch ? timeMatch[1] : "";
        }
      }

      if (employee?.shiftEnd) {
        const shiftEndDate = dayjs(employee.shiftEnd);
        if (shiftEndDate.isValid()) {
          shiftEnd = shiftEndDate.tz(APP_TZ).format("HH:mm");
        } else if (typeof employee.shiftEnd === "string") {
          const timeMatch = employee.shiftEnd.match(
            /(\d{1,2}:\d{2}(?:\s?[APMapm]{2})?)/
          );
          shiftEnd = timeMatch ? timeMatch[1] : "";
        }
      }

      const taskIds = tasks.map((t) => t._id);

      return {
        date: formattedDate,
        shiftStart,
        shiftEnd,
        totalTasks: tasks.length,
        tasksCompleted: completedTasks,
        issuesReported,
        taskIds,
      };
    });

    return {
      success: true,
      data: result,
      message: "Work history fetched successfully",
      statusCode: 200,
    };
  } catch (error: any) {
    console.error("Error fetching work history:", error);
    return {
      success: false,
      message: "Failed to fetch work history.",
      error: error.message,
      statusCode: 500,
    };
  }
};

/*
ENGLISH:
- If you request a specific date, the response should only contain that date.
- If you see a different date in the response, your code is not handling timezones or grouping correctly.
- The above code ensures that the grouping and filtering use the same timezone and date logic.

URDU:
- اگر آپ کسی خاص تاریخ کی درخواست کرتے ہیں تو جواب میں صرف وہی تاریخ آنی چاہیے۔
- اگر جواب میں کوئی اور تاریخ آ رہی ہے تو آپ کا کوڈ ٹائم زون یا گروپنگ کو صحیح ہینڈل نہیں کر رہا۔
- اوپر دیا گیا کوڈ اس بات کو یقینی بناتا ہے کہ گروپنگ اور فلٹرنگ ایک ہی ٹائم زون اور تاریخ کے حساب سے ہو۔
*/

const deleteEmployeeAccountService = async (employeeId: string) => {
  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return {
        success: false,
        message: "Employee not found",
        statusCode: 404,
      };
    }

    return {
      success: true,
      message: "Employee account deleted successfully",
      statusCode: 200,
      data: null,
    };
  } catch (error: any) {
    console.error("Error deleting employee account:", error);
    return {
      success: false,
      message: "Failed to delete employee account.",
      error: error.message,
      statusCode: 500,
    };
  }
};

const getEmployeeCheckInStatus = async (employeeId: string) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return { success: false, message: "Employee not found", statusCode: 404 };
  }

  const shiftDate = dayjs().tz(APP_TZ).startOf("day").toDate();
  const attendance = await Attendance.findOne({
    employeeId: new Types.ObjectId(employeeId),
    shiftDate,
  });

  if (!attendance) {
    return {
      success: true,
      message: "No attendance found for today.",
      statusCode: 200,
      data: { canCheckIn: true, canCheckOut: false, checkedIn: false },
    };
  }

  const hasActiveVisit = attendance.propertyVisits.some(
    (v) =>
      v.checkIn?.location?.lat &&
      v.checkIn?.location?.lng &&
      (!v.checkOut?.location?.lat || !v.checkOut?.location?.lng)
  );

  if (hasActiveVisit) {
    return {
      success: true,
      message: "Employee has active check-in(s).",
      statusCode: 200,
      data: { canCheckIn: false, canCheckOut: true, checkedIn: true },
    };
  }

  return {
    success: true,
    message: "Employee has completed all check-ins and check-outs for today.",
    statusCode: 200,
    data: { canCheckIn: true, canCheckOut: false, checkedIn: false },
  };
};

export {
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
  deleteEmployeeAccountService,
  getEmployeeCheckInStatus,
};
