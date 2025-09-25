import dotenv from "dotenv";
import connectDB from "../config/dbConfig.js";
import { markMissedTasksJob } from "../jobs/generateRoutinePickups.js";

// Load environment variables
dotenv.config();

// Ensure DB is connected before starting cron
await connectDB();

// Start the missed tasks cron in this isolated worker process
markMissedTasksJob();

// Graceful shutdown handling
const shutdown = () => {
  console.log("MissedTasksWorker shutting down...");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
