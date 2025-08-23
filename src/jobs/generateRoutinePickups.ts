import cron from "node-cron";
import dayjs from "dayjs";
import { IUser, User } from "../models/user.model.js";
import { PickupRequest } from "../models/admin/PickupRequest.model.js";
import { sendNotification } from "../utils/notification.js";
import { NotificationType } from "../models/notifications/notification.model.js";
import { Property } from "../models/admin/property.model.js";
import { Task } from "../models/admin/task.model.js";
import { Attendance } from "../models/employee/attendance.js";

/**
 * This job will run ONCE, 5 minutes after the server starts, for testing purposes.
 * After testing, revert to the original cron schedule.
 */
export const generateRoutinePickupsJob = () => {
  // Calculate the delay for 5 minutes (in milliseconds)
  const delayMs = 1 * 60 * 1000;

  setTimeout(async () => {
    console.log(
      "Running routine pickup job (test run after 5 minutes) at",
      new Date()
    );

    const tomorrow = dayjs().add(1, "day").startOf("day"); // Schedule for tomorrow
    const endOfDay = tomorrow.endOf("day");

    try {
      const users = await User.find({
        "routinePickup.isEnabled": true,
      }).populate("property");
      console.log(users);
      for (const user of users) {
        console.log(user);
        const pickupDays = user.routinePickup?.daysOfWeek?.length
          ? user.routinePickup.daysOfWeek
          : [0, 1, 2, 3, 4]; // include all days if not set
        const pickupTime = user.routinePickup?.defaultTime || "10:00";

        const scheduledDate = dayjs(
          `${tomorrow.format("YYYY-MM-DD")} ${pickupTime}`
        ).toDate();

        const isPickupDay = pickupDays.includes(tomorrow.day());
        console.log(isPickupDay);
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

        console.log(existing);
        if (existing) continue; // Already scheduled for this user

        await PickupRequest.create({
          userId: user._id,
          propertyId: user.property,
          unitNumber: user.unitNumber as unknown as string,
          pickupType: "routine",
          status: "pending",
          scheduledDate,
        });
        console.log("pickup request created");
        console.log(
          `Scheduled routine pickup for user ${user.name} on ${scheduledDate}`
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
    } catch (error) {
      console.error("Error generating routine pickups:", error);
    }
  }, delayMs);
};

/**
 * Cron job to mark PickupRequests and Tasks as missed if:
 * - There is a check-in but no check-out for the assigned employee on the scheduled date.
 * - There is neither a check-in nor a check-out for the assigned employee on the scheduled date.
 * This runs once a day (should be scheduled in your cron system).
 */
// export const markMissedPickupsAndTasks = async () => {
//   try {
//     // Get all pickup requests scheduled for today that are not completed or already missed
//     const todayStart = dayjs().startOf("day").toDate();
//     const todayEnd = dayjs().endOf("day").toDate();

//     // Find all pickup requests for today that are still scheduled or pending
//     const pickups = await PickupRequest.find({
//       date: { $gte: todayStart, $lte: todayEnd },
//       status: { $in: ["scheduled", "pending"] },
//     });

//     for (const pickup of pickups) {
//       // Find the assigned task for this pickup, if any
//       let task = null;
//       if (pickup.assignedTaskId) {
//         task = await Task.findById(pickup.assignedTaskId);
//       } else {
//         // Try to find a task linked to this pickup
//         task = await Task.findOne({ requestId: pickup._id });
//       }

//       // Find check-in and check-out for the assigned employee (if any)
//       let checkInAndCheckOut = null;
//       if (task && task.employeeId) {
//         checkInAndCheckOut = await Attendance.findOne({
//           employeeId: task.employeeId,
//           shiftDate: { $gte: todayStart, $lte: todayEnd },
//           clockIn: { $exists: true },
//           clockOut: { $exists: true },
//         });
//       }

//       // If check-in found but no check-out, or both not found, mark as missed
//       if (!checkInAndCheckOut) {
//         pickup.status = "missed";
//         await pickup.save();

//         if (task) {
//           task.status = "missed";
//           await task.save();
//         }
//       }
//     }
//     console.log("Missed pickups and tasks marked for today.");
//   } catch (error) {
//     console.error("Error in markMissedPickupsAndTasks cron job:", error);
//   }
// };
