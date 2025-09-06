// Migration script to update existing task statuses from "pending" to "scheduled"
// Run this script once to migrate existing data

import mongoose from "mongoose";
import { Task } from "../src/models/admin/task.model.js";
import { PickupRequest } from "../src/models/admin/PickupRequest.model.js";
import dotenv from "dotenv";

dotenv.config();

const migrateTaskStatuses = async () => {
  try {
    console.log("Starting task status migration...");

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database");

    // Find all tasks with "pending" status
    const pendingTasks = await Task.find({ status: "pending" });
    console.log(`Found ${pendingTasks.length} tasks with "pending" status`);

    // Update all pending tasks to scheduled
    const updateResult = await Task.updateMany(
      { status: "pending" },
      { $set: { status: "scheduled" } }
    );

    console.log(
      `Updated ${updateResult.modifiedCount} tasks from "pending" to "scheduled"`
    );

    // Verify the update
    const remainingPendingTasks = await Task.find({ status: "pending" });
    const scheduledTasks = await Task.find({ status: "scheduled" });

    console.log(
      `Remaining tasks with "pending" status: ${remainingPendingTasks.length}`
    );
    console.log(`Tasks with "scheduled" status: ${scheduledTasks.length}`);

    // Also update any PickupRequests that might have inconsistent statuses
    const pickupRequests = await PickupRequest.find({ status: "scheduled" });
    console.log(
      `Found ${pickupRequests.length} pickup requests with "scheduled" status`
    );

    // Check for any tasks that should have "scheduled" status but don't
    const tasksWithScheduledPickups = await Task.aggregate([
      {
        $lookup: {
          from: "pickuprequests",
          localField: "requestId",
          foreignField: "_id",
          as: "pickupRequest",
        },
      },
      {
        $match: {
          "pickupRequest.status": "scheduled",
          status: { $ne: "scheduled" },
        },
      },
    ]);

    console.log(
      `Found ${tasksWithScheduledPickups.length} tasks with mismatched statuses`
    );

    // Update mismatched tasks
    if (tasksWithScheduledPickups.length > 0) {
      const taskIds = tasksWithScheduledPickups.map((task) => task._id);
      const mismatchUpdateResult = await Task.updateMany(
        { _id: { $in: taskIds }, status: { $in: ["pending", "in_progress"] } },
        { $set: { status: "scheduled" } }
      );
      console.log(
        `Updated ${mismatchUpdateResult.modifiedCount} mismatched tasks`
      );
    }

    // Final verification
    const finalStats = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("\nFinal task status distribution:");
    finalStats.forEach((stat) => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });

    console.log("\nMigration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
};

// Run the migration
migrateTaskStatuses();
