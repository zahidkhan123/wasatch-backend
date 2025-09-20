import { PickupRequest } from "../../models/admin/PickupRequest.model.js";
import { Task } from "../../models/admin/task.model.js";
import { Types } from "mongoose";
import { Employee } from "../../models/employee/employee.model.js";
import { Property } from "../../models/admin/property.model.js";
import { EmployeePropertyAssignment } from "../../models/admin/EmployeePropertyAssignment.js";
import { sendNotification } from "../../utils/notification.js";
import { TemporaryAssignment } from "../../models/admin/TemporaryAssignmentModel.js";
import { NotificationType } from "../../models/notifications/notification.model.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import dayjs from "dayjs";
import { getDayRangeInTZ } from "../../helpers/helperFunctions.js";
import { createTaskStartedLog } from "./activityService.js";
import { APPLICATION_TIMEZONE } from "../../config/timezoneConfig.js";
dayjs.extend(utc);
dayjs.extend(timezone);
const APP_TZ = APPLICATION_TIMEZONE;
export const getTasksService = async (filters: {
  status?: string;
  date?: string;
  user_id?: string;
  employee_id?: string;
}): Promise<any> => {
  try {
    const taskQuery: any = {};
    console.log("status", filters.status);
    // If status is "on_demand", we want to filter by request type, not task status
    const requestMatch: any = {};
    if (filters.status) {
      if (filters.status === "on_demand") {
        requestMatch.type = "on_demand";
      } else if (filters.status === "all") {
        // Do not add any status filter, fetch all tasks
      } else {
        taskQuery.status = filters.status;
      }
    }
    console.log("taskQuery", taskQuery);
    if (filters.employee_id)
      taskQuery.assignedEmployees = new Types.ObjectId(filters.employee_id);

    if (filters.user_id) {
      requestMatch.userId = new Types.ObjectId(filters.user_id);
    }

    const tasks = await Task.find(taskQuery)
      .populate({
        path: "requestId",
        match: requestMatch,
        select: "type date userId timeSlot specialInstructions",
      })
      .select("-__v -updatedAt -createdAt")
      .sort({ scheduledStart: -1 });

    // Remove tasks where requestId was filtered out in match
    const filtered = tasks.filter((task) => task.requestId !== null);

    return {
      success: true,
      message: "Tasks fetched successfully",
      statusCode: 200,
      data: filtered,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch tasks",
      statusCode: 500,
      data: null,
      error: error instanceof Error ? error.message : error,
    };
  }
};

export const getTaskByIdService = async (id: string) => {
  try {
    const task = await Task.findById(new Types.ObjectId(id))
      .select(
        "employeeId requestId propertyId unitNumber buildingName apartmentName scheduledStart scheduledEnd specialInstructions status assignedEmployees actualStart actualEnd userId"
      )
      .populate(
        "assignedEmployees",
        "firstName lastName phone employeeId avatarUrl"
      )
      .populate({
        path: "requestId",
        select: "type date userId timeSlot specialInstructions propertyId",
        populate: {
          path: "userId",
          select: "buildingNumber unitNumber apartmentName",
        },
      })
      .populate("employeeId", "firstName lastName avatarUrl")
      .populate("propertyId", "name")
      .populate("issueReported", "issueType description")
      .lean();
    return {
      success: true,
      message: "Task fetched successfully",
      statusCode: 200,
      data: task,
    };
  } catch (error) {
    console.error("Task Fetch Error:", error);
    return {
      success: false,
      message: "Failed to fetch task",
      statusCode: 500,
      data: null,
      error: error instanceof Error ? error.message : error,
    };
  }
};

interface IAssignTaskInput {
  unitNumber: string;
  buildingName: string;
  apartmentName: string;
  propertyId: string;
  employeeId: string;
  scheduledDate: string;
  timeSlot: string;
  trashTypes: string[];
  specialInstructions?: string;
}

export const createAndAssignTaskManually = async (
  input: IAssignTaskInput & {
    isTemporaryAssignment?: boolean;
    tempAssignmentEndDate?: string;
    assignedBy: string; // Admin ID
    tempAssignmentReason?: string;
  }
) => {
  try {
    const {
      unitNumber,
      buildingName,
      apartmentName,
      propertyId,
      employeeId,
      scheduledDate,
      timeSlot,
      specialInstructions,
      isTemporaryAssignment = true,
      tempAssignmentEndDate,
      assignedBy,
      tempAssignmentReason = "Task assignment",
    } = input;

    // Validate employee and property
    const [employee, property] = await Promise.all([
      Employee.findById(employeeId),
      Property.findById(propertyId),
    ]);

    if (!employee || !property) {
      return {
        success: false,
        message: "Invalid employee or property ID.",
        statusCode: 404,
      };
    }

    // Check permanent assignment
    const isPermanentlyAssigned = await EmployeePropertyAssignment.exists({
      employeeId,
      propertyId,
      validFrom: { $lte: new Date() },
      $or: [{ validUntil: { $gte: new Date() } }, { validUntil: null }],
    });
    console.log(isPermanentlyAssigned, isTemporaryAssignment);

    // Handle temporary assignment if needed
    if (!isPermanentlyAssigned && isTemporaryAssignment) {
      await TemporaryAssignment.create({
        employeeId,
        propertyId,
        startDate: getDayRangeInTZ(scheduledDate).start,
        endDate: getDayRangeInTZ(scheduledDate).end,
        assignedBy,
        reason: tempAssignmentReason,
      });
    } else if (!isPermanentlyAssigned) {
      return {
        success: false,
        message: "Employee is not assigned to this property.",
        statusCode: 400,
      };
    }

    // Parse time slot and create task
    // const [startTimeStr, endTimeStr] = timeSlot.split(" — ");
    const scheduledStart = getDayRangeInTZ(scheduledDate).start;
    const scheduledEnd = getDayRangeInTZ(scheduledDate).end;

    const pickup = await PickupRequest.create({
      userId: null,
      propertyId,
      unitNumber,
      buildingNumber: buildingName,
      apartmentName,
      type: "on_demand",
      date: scheduledStart,
      timeSlot,
      specialInstructions,
      status: "scheduled",
    });

    const task = await Task.create({
      requestId: pickup._id,
      propertyId,
      employeeId,
      unitNumber,
      buildingName,
      apartmentName,
      scheduledStart,
      scheduledEnd,
      specialInstructions,
      status: "scheduled",
      assignedEmployees: [employeeId],
      isTemporaryAssignment,
    });

    (pickup as any).assignedTaskId = task._id as Types.ObjectId;
    await pickup.save();

    // Create activity log for task started (manual assignment)
    await createTaskStartedLog({
      taskId: (task._id as any).toString(),
      employeeId: (employee as any)._id.toString(),
      unitNumber: unitNumber,
      requestType: "on_demand",
    });

    // Notify employee

    await sendNotification(
      (employee as any)._id.toString(),
      "employee",
      "NewTaskAssign.svg",
      "Task Assignment",
      `New task assigned at ${unitNumber}, ${buildingName}${
        isTemporaryAssignment ? " (Temporary Assignment)" : ""
      }`,
      "task_assignment" as unknown as NotificationType
    );

    return {
      success: true,
      message: `Task created successfully`,
      statusCode: 201,
      data: task,
    };
  } catch (error: any) {
    console.error("Task Assignment Error:", error);
    return {
      success: false,
      message: "Failed to assign task.",
      statusCode: 500,
      error: error.message,
    };
  }
};

interface IReassignTaskInput {
  taskId: string;
  unitNumber?: string;
  buildingName?: string;
  apartmentName?: string;
  propertyId?: string;
  employeeId?: string;
  scheduledDate?: string;
  timeSlot?: string;
  specialInstructions?: string;
  isTemporaryAssignment?: boolean;
  tempAssignmentEndDate?: string;
  assignedBy: string; // Admin ID
  tempAssignmentReason?: string;
}

export const reassignTaskService = async (
  params: { id: string } & IReassignTaskInput
) => {
  try {
    const {
      id,
      taskId,
      unitNumber,
      buildingName,
      apartmentName,
      propertyId,
      employeeId,
      scheduledDate,
      timeSlot,
      specialInstructions,
      isTemporaryAssignment = true,
      tempAssignmentEndDate,
      assignedBy,
      tempAssignmentReason = "Task reassignment",
    } = params;

    // --- Fetch existing task ---
    const task = await Task.findById(taskId);
    if (!task) {
      return {
        success: false,
        message: "Task not found.",
        statusCode: 404,
      };
    }

    // --- Fetch pickup request ---
    const pickup = await PickupRequest.findById(task.requestId);
    if (!pickup) {
      return {
        success: false,
        message: "Associated pickup request not found.",
        statusCode: 404,
      };
    }

    // --- Slot limit check (max 35 tasks per hour) ---
    if (scheduledDate && timeSlot) {
      let slotStart, slotEnd;
      try {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
          throw new Error("Invalid scheduledDate format.");
        }

        const timeSlotStr = timeSlot
          .trim()
          .replace(/—|–/g, "-")
          .replace(/\s*-\s*/g, "-");
        const [startTimeRaw] = timeSlotStr.split("-");
        const startTime = startTimeRaw.trim();

        if (!/^\d{2}:\d{2}$/.test(startTime)) {
          throw new Error("Invalid timeSlot format.");
        }

        const [year, month, day] = scheduledDate.split("-");
        const [hour, minute] = startTime.split(":");
        slotStart = dayjs.tz(
          `${year}-${month}-${day}T${hour}:${minute}:00`,
          APP_TZ
        );
        if (!slotStart.isValid()) {
          throw new Error("Invalid slot start time.");
        }
        slotEnd = slotStart.add(1, "hour");
      } catch {
        return {
          success: false,
          message: "Invalid scheduledDate or timeSlot format.",
          statusCode: 400,
        };
      }

      const targetPropertyId = propertyId || task.propertyId;
      const existingTasksCount = await Task.countDocuments({
        propertyId: targetPropertyId,
        scheduledStart: { $gte: slotStart.toDate(), $lt: slotEnd.toDate() },
        _id: { $ne: task._id },
      });

      if (existingTasksCount >= 35) {
        return {
          success: false,
          message:
            "Maximum number of tasks already scheduled for this one-hour slot. Please select another time.",
          statusCode: 409,
        };
      }
    }

    // --- Employee reassignment ---
    if (
      employeeId &&
      (!task.employeeId || employeeId !== task.employeeId.toString())
    ) {
      const targetPropertyId = propertyId || task.propertyId;
      const [employee, property] = await Promise.all([
        Employee.findById(employeeId),
        Property.findById(targetPropertyId),
      ]);

      if (!employee || !property) {
        return {
          success: false,
          message: "Invalid employee or property.",
          statusCode: 404,
        };
      }

      const isPermanentlyAssigned = await EmployeePropertyAssignment.exists({
        employeeId,
        propertyId: targetPropertyId,
        validFrom: { $lte: new Date() },
        $or: [{ validUntil: { $gte: new Date() } }, { validUntil: null }],
      });

      if (!isPermanentlyAssigned && isTemporaryAssignment) {
        const taskDate =
          scheduledDate || dayjs(task.scheduledStart).format("YYYY-MM-DD");
        await TemporaryAssignment.create({
          employeeId,
          propertyId: targetPropertyId,
          startDate: getDayRangeInTZ(taskDate).start,
          endDate: getDayRangeInTZ(tempAssignmentEndDate || taskDate).end,
          assignedBy: new Types.ObjectId(id),
          reason: tempAssignmentReason,
        });
      } else if (!isPermanentlyAssigned) {
        return {
          success: false,
          message: "Employee is not assigned to this property.",
          statusCode: 400,
        };
      }

      await sendNotification(
        (employee as any)._id.toString(),
        "employee",
        "NewTaskAssign.svg",
        "Task Reassignment",
        `You have been assigned a new task at ${unitNumber || task.unitNumber || "Unknown"}, ${
          buildingName || task.buildingName || "Unknown"
        }${isTemporaryAssignment ? " (Temporary Assignment)" : ""}`,
        "task_assignment" as unknown as NotificationType
      );

      task.employeeId = new Types.ObjectId(employeeId) as any;
      task.assignedEmployees = [employeeId] as any;
    }

    // --- Update task fields ---
    if (unitNumber) task.unitNumber = unitNumber;
    if (buildingName) task.buildingName = buildingName;
    if (apartmentName) task.apartmentName = apartmentName;
    if (propertyId) task.propertyId = new Types.ObjectId(propertyId) as any;
    if (specialInstructions !== undefined)
      task.specialInstructions = specialInstructions;
    if (scheduledDate) {
      const dayRange = getDayRangeInTZ(scheduledDate);
      task.scheduledStart = dayRange.start;
      task.scheduledEnd = dayRange.end;
    }
    if (timeSlot) (task as any).timeSlot = timeSlot;

    await task.save();

    // --- Update pickup request fields ---
    if (unitNumber) pickup.unitNumber = unitNumber;
    if (buildingName) pickup.buildingNumber = buildingName;
    if (apartmentName) pickup.apartmentName = apartmentName;
    if (propertyId) pickup.propertyId = new Types.ObjectId(propertyId) as any;
    if (specialInstructions !== undefined)
      pickup.specialInstructions = specialInstructions;
    if (timeSlot) (pickup as any).timeSlot = timeSlot;
    if (scheduledDate) pickup.date = getDayRangeInTZ(scheduledDate).start;

    await pickup.save();

    return {
      success: true,
      message: "Task reassigned successfully.",
      statusCode: 200,
      data: task,
    };
  } catch (error: any) {
    console.error("Reassign Task Error:", error);
    return {
      success: false,
      message: "Failed to reassign task.",
      statusCode: 500,
      error: error.message,
    };
  }
};
