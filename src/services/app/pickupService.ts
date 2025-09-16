import { PickupRequest } from "../../models/admin/PickupRequest.model.js";
import { User } from "../../models/user.model.js";
import { sendNotification } from "../../utils/notification.js";
import { Types } from "mongoose";
import dayjs from "dayjs";
import { EmployeePropertyAssignment } from "../../models/admin/EmployeePropertyAssignment.js";
import { Task } from "../../models/admin/task.model.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { getDayRangeInTZ } from "../../helpers/helperFunctions.js";
import { createTaskStartedLog } from "../admin/activityService.js";
import { APPLICATION_TIMEZONE } from "../../config/timezoneConfig.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const APP_TZ = APPLICATION_TIMEZONE;

export const createOnDemandPickup = async (
  requestData: {
    scheduledDate: string;
    timeSlot: string;
    specialInstructions?: string;
  },
  userId: string
) => {
  try {
    const today = getDayRangeInTZ(
      dayjs().tz(APP_TZ).startOf("day").toISOString()
    );
    const user = await User.findById(userId).populate("property");
    if (!user) {
      return {
        success: false,
        message: "User not found.",
        statusCode: 404,
      };
    }
    const assignments = await EmployeePropertyAssignment.find({
      propertyId: user.property?._id,
      validFrom: { $lte: today.start },
      $or: [{ validUntil: null }, { validUntil: { $gte: today.end } }],
    });
    const assignedEmployeeIds = assignments.map((a) => a.employeeId);
    if (assignedEmployeeIds.length === 0) {
      return {
        success: true,
        message: "No employees are assigned to your property.",
        statusCode: 201,
      };
    }

    // --- One-hour slot limit check (max 35 tasks per hour) ---
    // Accept timeSlot in formats like "10:00", "10:00—11:00", "10:00 — 11:00", etc.
    // We'll extract the start time from the timeSlot string.

    let slotStart: dayjs.Dayjs;
    let slotEnd: dayjs.Dayjs;
    try {
      // Validate scheduledDate
      if (!/^\d{4}-\d{2}-\d{2}$/.test(requestData.scheduledDate)) {
        throw new Error("Invalid scheduledDate format.");
      }

      // Extract start time from timeSlot (handles "10:00", "10:00—11:00", "10:00 — 11:00", etc.)
      let timeSlotStr = requestData.timeSlot.trim();
      // Replace em dash and en dash with normal dash for easier splitting
      timeSlotStr = timeSlotStr.replace(/—|–/g, "-");
      // Remove extra spaces around dashes
      timeSlotStr = timeSlotStr.replace(/\s*-\s*/g, "-");
      // Split on dash, take the first part as start time
      const [startTimeRaw] = timeSlotStr.split("-");
      const startTime = startTimeRaw.trim();

      if (!/^\d{2}:\d{2}$/.test(startTime)) {
        throw new Error("Invalid timeSlot format.");
      }

      // Use dayjs.tz with separate date and time for reliability
      const [year, month, day] = requestData.scheduledDate.split("-");
      const [hour, minute] = startTime.split(":");
      slotStart = dayjs.tz(
        `${year}-${month}-${day}T${hour}:${minute}:00`,
        APP_TZ
      );
      if (!slotStart.isValid()) {
        throw new Error("Invalid slot start time.");
      }
      // Set slotEnd to one hour after slotStart
      slotEnd = slotStart.add(1, "hour");
    } catch (err) {
      console.log(err);
      return {
        success: false,
        message: "Invalid scheduledDate or timeSlot format.",
        statusCode: 400,
      };
    }

    // Find all tasks for this property, on this date, in this one-hour slot
    const existingTasksCount = await Task.countDocuments({
      propertyId: user.property?._id,
      scheduledStart: { $gte: slotStart.toDate(), $lt: slotEnd.toDate() },
      // Optionally, you can filter by status if you want to only count "pending"/"scheduled" tasks
      // status: { $in: ["pending", "scheduled"] },
    });

    if (existingTasksCount >= 35) {
      return {
        success: false,
        message:
          "Maximum number of pickups already scheduled for this hour. Please select another time.",
        statusCode: 409,
      };
    }
    // --- End slot limit check ---

    // Step 1: Create the pickup request
    const pickup = await PickupRequest.create({
      userId: user._id,
      propertyId: user.property?._id,
      unitNumber: user.unitNumber,
      buildingName: user.buildingNumber,
      apartmentName: user.apartmentName,
      type: "on_demand",
      date: getDayRangeInTZ(requestData.scheduledDate).start,
      timeSlot: requestData.timeSlot,
      specialInstructions: requestData.specialInstructions || "",
      status: "scheduled",
    });

    if (assignedEmployeeIds.length > 0) {
      // Step 3: Create a shared task (assign to all)
      const task = await Task.create({
        requestId: pickup._id,
        propertyId: pickup.propertyId,
        unitNumber: pickup.unitNumber,
        buildingName: pickup.buildingNumber,
        apartmentName: pickup.apartmentName,
        scheduledStart: slotStart.toDate(),
        scheduledEnd: slotEnd.toDate(),
        assignedEmployees: assignedEmployeeIds, // <-- NEW FIELD
        specialInstructions: pickup.specialInstructions,
        status: "pending",
        trashTypes: [],
      });

      // Link task to pickup
      (pickup as any).assignedTaskId = task._id;
      await pickup.save();

      // Create activity log for task started (on-demand pickup)
      await createTaskStartedLog({
        taskId: (task._id as any).toString(),
        unitNumber: pickup.unitNumber,
        requestType: "on_demand",
      });

      // Step 4: Notify all assigned employees
      for (const empId of assignedEmployeeIds) {
        await sendNotification(
          empId.toString(),
          "employee",
          "pickup.svg",
          "Pickup Status",
          `A new pickup at ${pickup.unitNumber}, ${pickup.buildingNumber}, ${pickup.apartmentName} has been assigned.`,
          "pickup_status"
        );
      }
    }

    // Step 5: Notify the user
    await sendNotification(
      (user as { _id: Types.ObjectId })._id.toString(),
      "user",
      "pickup.svg",
      "Pickup Status",
      "Your pickup has been scheduled and will be handled shortly.",
      "pickup_status"
    );

    return {
      success: true,
      message:
        "Pickup request created and task assigned to property employees.",
      statusCode: 201,
      data: pickup,
    };
  } catch (err: any) {
    console.error("Pickup creation error:", err);
    return {
      success: false,
      message: "Failed to create pickup request.",
      error: err.message,
      statusCode: 400,
    };
  }
};

interface GetPickupRequestsOptions {
  userId?: string;
  status?: "all" | "completed" | "missed" | "scheduled";
  page?: number;
  limit?: number;
}

/**
 * Get pickup requests with optional date filtering.
 *
 * Example usage for date filtering:
 *   getPickupRequests({
 *     userId: "...",
 *     status: "all",
 *     page: 1,
 *     limit: 10,
 *     dateFrom: "2024-06-01",
 *     dateTo: "2024-06-10"
 *   })
 *
 * This will return all pickup requests for the user between June 1 and June 10, 2024.
 */

interface GetPickupRequestsOptions {
  userId?: string;
  status?: "all" | "completed" | "missed" | "scheduled";
  // page?: number | string;
  // limit?: number | string;

  // NEW: single-day filter
  date?: string; // e.g. "2025-07-31"

  // Backward-compatible range filters
  dateFrom?: string; // e.g. "2025-07-26"
  dateTo?: string; // e.g. "2025-08-26"
}

export const getPickupRequests = async ({
  userId,
  status = "all",
  page = 1,
  limit = 10,
  date, // NEW single-day filter
  dateFrom,
  dateTo,
}: GetPickupRequestsOptions) => {
  try {
    console.log("date", date);
    console.log("dateFrom", dateFrom);
    console.log("dateTo", dateTo);
    const today = getDayRangeInTZ(
      dayjs().tz(APP_TZ).startOf("day").toISOString()
    );
    console.log("today", today);
    // Normalize pagination
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, any> = {};

    // userId (optional & validated)
    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        return { success: false, statusCode: 400, message: "Invalid userId." };
      }
      query.userId = new Types.ObjectId(userId);
    }

    // ---- Date filtering ----
    // If "date" is provided, it *overrides* dateFrom/dateTo and filters that whole day.
    if (date) {
      console.log("date", date);
      const start = getDayRangeInTZ(date).start;
      const end = getDayRangeInTZ(date).end;
      console.log(start, end);
      query.date = { $gte: start, $lte: end };
    } else if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) {
        dateFilter.$gte = getDayRangeInTZ(dateFrom).start;
      }
      if (dateTo) {
        dateFilter.$lte = getDayRangeInTZ(dateTo).end;
      }
      query.date = { ...(query.date || {}), ...dateFilter };
    }

    // ---- Status filtering ----
    const now = getDayRangeInTZ(dayjs().toISOString()).start;
    switch (status) {
      case "completed":
        query.status = "completed";
        break;

      case "missed":
        query.status = "missed";
        // Only add implicit "past" bound if no explicit date(s)
        if (!date && !dateFrom && !dateTo) {
          query.date = { ...(query.date || {}), $lt: now };
        }
        break;

      case "scheduled":
        query.status = "scheduled";
        // Only add implicit "future" bound if no explicit date(s)
        if (!date && !dateFrom && !dateTo) {
          query.date = { ...(query.date || {}), $gte: now };
        }
        break;

      case "all":
      default:
        // no status constraint
        break;
    }

    // ---- Query ----
    const [data, total] = await Promise.all([
      PickupRequest.find(query)
        .select(
          "date status unitNumber buildingName timeSlot type specialInstructions apartmentName"
        )
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum),
      PickupRequest.countDocuments(query),
    ]);

    return {
      success: true,
      message: "Pickup requests fetched successfully.",
      statusCode: 200,
      data,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to fetch pickup requests.",
      error: error.message,
      statusCode: 500,
    };
  }
};

export const getUserDashboardPickupData = async (userId: string) => {
  // Fetch recent pickups (latest first)
  const recentPickups = await PickupRequest.find({ userId })
    .sort({ date: -1 })
    .limit(5) // You can adjust how many recent pickups you want to return
    .select(
      "date status unitNumber buildingName timeSlot type specialInstructions apartmentName"
    );
  const start = getDayRangeInTZ(dayjs().toISOString()).start;
  console.log("start", start);
  // Fetch the next scheduled routine pickup
  const nextRoutinePickup = await PickupRequest.findOne({
    userId,
    status: "scheduled",
    date: { $gte: start }, // Future pickups only
  })
    .sort({ date: 1 }) // Nearest upcoming
    .select(
      "date status type unitNumber buildingName timeSlot specialInstructions apartmentName"
    );

  return {
    success: true,
    message: "Pickup data fetched successfully.",
    statusCode: 200,
    data: {
      nextRoutinePickup,
      recentPickups,
    },
  };
};
