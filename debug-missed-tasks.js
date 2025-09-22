// Debug script to check why tasks aren't being marked as missed
// Run this in your Node.js environment or add to a route for testing

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { APPLICATION_TIMEZONE } from "./src/config/timezoneConfig.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// Debug function to check a specific task
export const debugMissedTask = async (taskId) => {
  try {
    // Get current time in application timezone
    const now = dayjs().tz(APPLICATION_TIMEZONE);
    console.log("Current time (MST):", now.format("YYYY-MM-DD HH:mm:ss"));
    console.log("Current time (UTC):", now.utc().format("YYYY-MM-DD HH:mm:ss"));

    // Find the specific task
    const task = await Task.findById(taskId).populate("requestId");

    if (!task) {
      console.log("❌ Task not found");
      return;
    }

    // console.log("Task found:");
    // console.log("- ID:", task._id);
    // console.log("- Unit:", task.unitNumber);
    // console.log("- Status:", task.status);
    // console.log(
    //   "- Scheduled Start:",
    //   dayjs(task.scheduledStart)
    //     .tz(APPLICATION_TIMEZONE)
    //     .format("YYYY-MM-DD HH:mm:ss")
    // );
    // console.log(
    //   "- Scheduled End:",
    //   dayjs(task.scheduledEnd)
    //     .tz(APPLICATION_TIMEZONE)
    //     .format("YYYY-MM-DD HH:mm:ss")
    // );

    // Check if task should be marked as missed
    const isOverdue = task.scheduledEnd < now.toDate();
    const hasCorrectStatus = ["pending", "in_progress"].includes(task.status);

    // console.log("\n=== ANALYSIS ===");
    // console.log("Is overdue?", isOverdue);
    // console.log("Has correct status?", hasCorrectStatus);
    // console.log("Should be marked as missed?", isOverdue && hasCorrectStatus);

    if (!hasCorrectStatus) {
      // console.log("❌ Task status is not 'pending' or 'in_progress'");
      // console.log("Current status:", task.status);
    }

    if (!isOverdue) {
      // console.log("❌ Task is not overdue yet");
      // console.log(
      //   "Scheduled end:",
      //   dayjs(task.scheduledEnd)
      //     .tz(APPLICATION_TIMEZONE)
      //     .format("YYYY-MM-DD HH:mm:ss")
      // );
      // console.log("Current time:", now.format("YYYY-MM-DD HH:mm:ss"));
    }

    // Test the exact query used by the cron job
    const overdueTasks = await Task.find({
      _id: task._id,
      status: { $in: ["pending", "in_progress"] },
      scheduledEnd: { $lt: now.toDate() },
    });

    // console.log("\n=== QUERY TEST ===");
    // console.log("Tasks found by cron query:", overdueTasks.length);

    if (overdueTasks.length === 0) {
      // console.log("❌ Task would NOT be found by the cron job query");
    } else {
      // console.log("✅ Task WOULD be found by the cron job query");
    }
  } catch (error) {
    console.error("Error debugging task:", error);
  }
};

// Function to check all overdue tasks
export const debugAllOverdueTasks = async () => {
  try {
    // console.log("=== CHECKING ALL OVERDUE TASKS ===");

    const now = dayjs().tz(APPLICATION_TIMEZONE).toDate();
    // console.log(
    //   "Current time:",
    //   dayjs(now).tz(APPLICATION_TIMEZONE).format("YYYY-MM-DD HH:mm:ss")
    // );

    // Find all tasks that should be overdue
    const overdueTasks = await Task.find({
      status: { $in: ["pending", "in_progress"] },
      scheduledEnd: { $lt: now },
    }).populate("requestId");

    console.log(`Found ${overdueTasks.length} overdue tasks:`);

    overdueTasks.forEach((task, index) => {
      // console.log(`\n${index + 1}. Task ${task._id}:`);
      // console.log(`   Unit: ${task.unitNumber}`);
      // console.log(`   Status: ${task.status}`);
      // console.log(
      //   `   Scheduled End: ${dayjs(task.scheduledEnd).tz(APPLICATION_TIMEZONE).format("YYYY-MM-DD HH:mm:ss")}`
      // );
    });

    return overdueTasks;
  } catch (error) {
    console.error("Error checking overdue tasks:", error);
  }
};

// Usage examples:
// debugMissedTask("YOUR_TASK_ID_HERE");
// debugAllOverdueTasks();
