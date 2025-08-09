import cron from "node-cron";
import { Archive } from "../models/archive/archive.model.js";

// For testing: Run cleanup every 1 minute after account deletion
export const startArchiveCleanupJob = () => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    console.log("Running archive cleanup (every 1 minute for testing)...");
    try {
      await Archive.cleanupOld();
      console.log("Archive cleanup done.");
    } catch (error) {
      console.error("Error during archive cleanup:", error);
    }
  });
};
