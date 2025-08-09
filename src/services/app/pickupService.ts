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

dayjs.extend(utc);
dayjs.extend(timezone);

const APP_TZ = "America/New_York";

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
    console.log(user.property?._id);
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
        scheduledStart: getDayRangeInTZ(requestData.scheduledDate).start,
        scheduledEnd: getDayRangeInTZ(requestData.scheduledDate).end,
        assignedEmployees: assignedEmployeeIds, // <-- NEW FIELD
        specialInstructions: pickup.specialInstructions,
        status: "pending",
        trashTypes: [],
      });

      // Link task to pickup
      (pickup as any).assignedTaskId = task._id;
      await pickup.save();

      // Step 4: Notify all assigned employees
      for (const empId of assignedEmployeeIds) {
        await sendNotification(
          empId.toString(),
          "employee",
          `A new pickup at ${pickup.unitNumber}, ${pickup.buildingNumber}, ${pickup.apartmentName} has been assigned.`,
          "pickup_status"
        );
      }
    }

    // Step 5: Notify the user
    await sendNotification(
      (user as { _id: Types.ObjectId })._id.toString(),
      "user",
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
    const today = getDayRangeInTZ(
      dayjs().tz(APP_TZ).startOf("day").toISOString()
    );
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
