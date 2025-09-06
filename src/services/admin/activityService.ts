// services/activityLog.service.ts
import {
  ActivityLog,
  IActivityLog,
} from "../../models/admin/activityLog.model.js";

// Create log
export const createActivityLogService = async (data: Partial<IActivityLog>) => {
  try {
    const log = new ActivityLog(data);
    await log.save();
    return {
      success: true,
      statusCode: 200,
      data: log,
      message: "Activity log created successfully",
    };
  } catch (error) {
    // You may want to log the error or handle it as needed
    return {
      success: false,
      statusCode: 500,
      data: null,
      message: "Failed to create activity log",
    };
  }
};

// Helper function to create task started log
export const createTaskStartedLog = async (taskData: {
  taskId: string;
  employeeId?: string;
  employeeName?: string;
  unitNumber: string;
  requestType?: string;
}) => {
  return createActivityLogService({
    employeeId: taskData.employeeId,
    employeeName: taskData.employeeName,
    unitNumber: taskData.unitNumber,
    type: "TASK_STARTED",
    requestType: taskData.requestType,
    taskId: taskData.taskId,
  });
};

// Helper function to create task completed log
export const createTaskCompletedLog = async (taskData: {
  taskId: string;
  employeeId?: string;
  employeeName?: string;
  unitNumber: string;
  requestType?: string;
}) => {
  return createActivityLogService({
    employeeId: taskData.employeeId,
    employeeName: taskData.employeeName,
    unitNumber: taskData.unitNumber,
    type: "TASK_COMPLETED",
    requestType: taskData.requestType,
    taskId: taskData.taskId,
  });
};

// Helper function to create task missed log
export const createTaskMissedLog = async (taskData: {
  taskId?: string;
  employeeId?: string;
  employeeName?: string;
  unitNumber: string;
  requestType?: string;
}) => {
  return createActivityLogService({
    employeeId: taskData.employeeId,
    employeeName: taskData.employeeName,
    unitNumber: taskData.unitNumber,
    type: "TASK_MISSED",
    requestType: taskData.requestType,
    taskId: taskData.taskId,
  });
};

// Helper function to create issue reported log
export const createIssueReportedLog = async (issueData: {
  issueId: string;
  taskId?: string;
  employeeId?: string;
  employeeName?: string;
  unitNumber: string;
  requestType?: string;
}) => {
  return createActivityLogService({
    employeeId: issueData.employeeId,
    employeeName: issueData.employeeName,
    unitNumber: issueData.unitNumber,
    type: "ISSUE_REPORTED",
    requestType: issueData.requestType,
    taskId: issueData.taskId,
    issueId: issueData.issueId,
  });
};

const getIconType = (type: string) => {
  switch (type) {
    // case "PICKUP_COMPLETED":
    //   return "check";
    // case "MISSED_PICKUP":
    //   return "cross";
    case "TASK_STARTED":
      return "check.svg";
    case "TASK_COMPLETED":
      return "check.svg";
    case "TASK_MISSED":
      return "cross.svg";
    case "ISSUE_REPORTED":
      return "alert.svg";
    default:
      return "info.svg";
  }
};

// Get logs (with pagination)
export const getActivityLogsService = async (
  page: number = 1,
  limit: number = 20,
  employeeId?: string
): Promise<{
  success: boolean;
  statusCode: number;
  data: { logs: (IActivityLog & { iconType: string })[]; total: number };
  message: string;
}> => {
  try {
    let skip = (page - 1) * limit;
    let queryLimit = limit;

    // Build filter object based on employee_id
    const filter: any = {};
    if (employeeId) {
      filter.employeeId = employeeId;
      // If employeeId is present, always return only 5 records
      queryLimit = 5;
      skip = 0; // Always start from the first record for employee logs
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(queryLimit),
      ActivityLog.countDocuments(filter),
    ]);

    // Attach icon type for each log
    const formattedLogs = logs.map((log) => ({
      ...log.toObject(),
      icon: getIconType(log.type),
    }));

    return {
      success: true,
      statusCode: 200,
      data: { logs: formattedLogs as any, total },
      message: "Activity logs fetched successfully",
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      message: "Failed to fetch activity logs",
      data: { logs: [], total: 0 },
    };
  }
};
