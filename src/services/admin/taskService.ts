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
dayjs.extend(utc);
dayjs.extend(timezone);
const APP_TZ = "America/New_York";
export const getTasksService = async (filters: {
  status?: string;
  date?: string;
  user_id?: string;
  employee_id?: string;
}): Promise<any> => {
  try {
    const taskQuery: any = {};

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
        "employeeId requestId propertyId unitNumber buildingName apartmentName scheduledStart scheduledEnd specialInstructions status assignedEmployees actualStart actualEnd"
      )
      .populate(
        "assignedEmployees",
        "firstName lastName phone employeeId avatarUrl"
      )
      .populate("requestId", "type date userId timeSlot specialInstructions")
      .populate("employeeId", "firstName lastName avatarUrl")
      .populate("propertyId", "name");
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
      status: "pending",
      assignedEmployees: [employeeId],
      isTemporaryAssignment,
    });

    (pickup as any).assignedTaskId = task._id as Types.ObjectId;
    await pickup.save();

    // Notify employee

    await sendNotification(
      (employee as any)._id.toString(),
      "employee",
      "pickup.png",
      "Task Assignment",
      `New task assigned at ${unitNumber}, ${buildingName}${
        isTemporaryAssignment ? " (Temporary Assignment)" : ""
      }`,
      "task_assignment" as unknown as NotificationType
    );

    return {
      success: true,
      message: `Task created and assigned successfully.${
        isTemporaryAssignment ? " Temporary property assignment created." : ""
      }`,
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
