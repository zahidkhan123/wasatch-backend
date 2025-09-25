import cron from "node-cron";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { IUser, User } from "../models/user.model.js";
import { PickupRequest } from "../models/admin/PickupRequest.model.js";
import { sendNotification } from "../utils/notification.js";
import { NotificationType } from "../models/notifications/notification.model.js";
import { Property } from "../models/admin/property.model.js";
import { Task } from "../models/admin/task.model.js";
import { Attendance } from "../models/employee/attendance.js";
import { createTaskMissedLog } from "../services/admin/activityService.js";
import { APPLICATION_TIMEZONE } from "../config/timezoneConfig.js";

// Ensure dayjs has timezone support in any process that imports this module
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Generate routine pickups for tomorrow
 * This function creates pickup requests for users who have routine pickups enabled
 */
export const generateRoutinePickups = async () => {
  try {
    console.log("Running routine pickup generation job at", new Date());

    const tomorrow = dayjs()
      .tz(APPLICATION_TIMEZONE)
      .add(1, "day")
      .startOf("day");
    const endOfDay = tomorrow.endOf("day");

    const users = await User.find({
      "routinePickup.isEnabled": true,
    }).populate("property");

    console.log(`Found ${users.length} users with routine pickups enabled`);

    for (const user of users) {
      const pickupDays = user.routinePickup?.daysOfWeek?.length
        ? user.routinePickup.daysOfWeek
        : [0, 1, 2, 3, 4]; // include all days if not set
      const pickupTime = user.routinePickup?.defaultTime || "10:00";

      const scheduledDate = dayjs
        .tz(
          `${tomorrow.format("YYYY-MM-DD")} ${pickupTime}`,
          APPLICATION_TIMEZONE
        )
        .toDate();

      const isPickupDay = pickupDays.includes(tomorrow.day());
      if (!isPickupDay) continue;

      const existing = await PickupRequest.findOne({
        userId: user._id,
        pickupType: "routine",
        propertyId: user.property,
        scheduledDate: {
          $gte: tomorrow.toDate(),
          $lte: endOfDay.toDate(),
        },
      });

      if (existing) continue; // Already scheduled for this user

      await PickupRequest.create({
        userId: user._id,
        propertyId: user.property,
        unitNumber: user.unitNumber as unknown as string,
        pickupType: "routine",
        status: "pending",
        scheduledDate,
      });

      console.log(
        `Scheduled routine pickup for user ${user.profile.firstName ? user.profile.firstName : user.email} on ${scheduledDate}`
      );

      await sendNotification(
        (user as { _id: string })._id,
        "user",
        "pickup.svg",
        "Routine Pickup",
        `We will collect your trash on ${dayjs(scheduledDate).format(
          "DD MMM YYYY"
        )} at ${pickupTime}.`,
        "routine_pickup" as unknown as NotificationType
      );
    }

    console.log("Routine pickup generation completed successfully");
  } catch (error) {
    console.error("Error generating routine pickups:", error);
  }
};

/**
 * Cron job to generate routine pickups
 * Runs daily at 6 PM in the application timezone
 */
export const generateRoutinePickupsJob = () => {
  // Run daily at 6 PM in the application timezone
  cron.schedule(
    "0 18 * * *",
    () => {
      console.log("Starting routine pickup generation cron job");
      generateRoutinePickups();
    },
    {
      timezone: APPLICATION_TIMEZONE,
    }
  );

  console.log(
    `Routine pickup generation cron job scheduled for 6 PM ${APPLICATION_TIMEZONE}`
  );
};

/**
 * Mark tasks as missed if their scheduled end time has passed
 * This function checks tasks that are still pending or in_progress but past their scheduled end time
 */
export const markMissedTasks = async () => {
  try {
    console.log("Running missed tasks check at", new Date());

    const now = dayjs().tz(APPLICATION_TIMEZONE).toDate();
    console.log(
      "Current time (MST):",
      dayjs(now).tz(APPLICATION_TIMEZONE).format("YYYY-MM-DD HH:mm:ss")
    );
    console.log(
      "Current time (UTC):",
      dayjs(now).utc().format("YYYY-MM-DD HH:mm:ss")
    );

    // Find all tasks that are pending, in_progress, or scheduled but past their scheduled end time
    const overdueTasks = await Task.find({
      status: { $in: ["pending", "in_progress", "scheduled"] },
      scheduledEnd: { $lt: now },
    }).populate("requestId");

    console.log(`Found ${overdueTasks.length} overdue tasks`);

    // Debug: Log details of each overdue task
    overdueTasks.forEach((task, index) => {
      console.log(`Overdue Task ${index + 1}:`);
      console.log(`  - ID: ${task._id}`);
      console.log(`  - Unit: ${task.unitNumber}`);
      console.log(`  - Status: ${task.status}`);
      console.log(
        `  - Scheduled End: ${dayjs(task.scheduledEnd).tz(APPLICATION_TIMEZONE).format("YYYY-MM-DD HH:mm:ss")}`
      );
    });

    for (const task of overdueTasks) {
      // Mark task as missed
      task.status = "missed";
      await task.save();

      // Update associated pickup request if exists
      if (task.requestId) {
        await PickupRequest.updateOne(
          { _id: (task.requestId as any)._id },
          { $set: { status: "missed" } }
        );
      }

      // Create activity log for task missed
      await createTaskMissedLog({
        taskId: (task._id as any).toString(),
        employeeId: task.employeeId
          ? (task.employeeId as any).toString()
          : undefined,
        unitNumber: task.unitNumber,
        requestType: (task.requestId as any)?.type || "routine",
      });

      console.log(
        `Marked task ${task._id} as missed for unit ${task.unitNumber}`
      );

      // Send notification to user if pickup request exists
      if (task.requestId && (task.requestId as any).userId) {
        await sendNotification(
          (task.requestId as any).userId.toString(),
          "user",
          "pickup_missed.svg",
          "Missed Pickup",
          `Your pickup at ${task.unitNumber} was missed on ${dayjs(
            task.scheduledEnd
          ).format(
            "DD MMM YYYY"
          )} at ${dayjs(task.scheduledEnd).format("HH:mm")}.`,
          "pickup_missed" as unknown as NotificationType
        );
      }
    }

    console.log(`Marked ${overdueTasks.length} tasks as missed`);
  } catch (error) {
    console.error("Error in markMissedTasks:", error);
  }
};

/**
 * Cron job to mark missed tasks
 * Runs every 30 minutes to check for overdue tasks
 */
export const markMissedTasksJob = () => {
  // Run every 30 minutes
  cron.schedule(
    "*/10 * * * *",
    () => {
      console.log("Starting missed tasks check cron job");
      markMissedTasks();
    },
    {
      timezone: APPLICATION_TIMEZONE,
    }
  );

  console.log(
    `Missed tasks check cron job scheduled every 10 minutes in ${APPLICATION_TIMEZONE}`
  );
};
