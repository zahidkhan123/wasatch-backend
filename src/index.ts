import express, { Request, Response } from "express";
import dotenv from "dotenv";
import helmet from "helmet";

import authRoutes from "./routes/app/authRoutes.js";
import userRoutes from "./routes/app/userRoutes.js";
import adminRoutes from "./routes/admin/adminUserRoutes.js";
// import googleMeetRoutes from "./routes/googleMeetRoutes"
import morgan from "morgan";
import connectDB from "./config/dbConfig.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";
// import { container } from "./container"
import "./workers/emailWorker.js";
import notificationRoutes from "./routes/app/notificationRoutes.js";
import complaintRoutes from "./routes/app/complaintRoutes.js";
import settingsRoutes from "./routes/app/settingRoutes.js";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import cors from "cors";
import propertyRoutes from "./routes/admin/propertyRouteHandler.js";
import { generateRoutinePickupsJob } from "./jobs/generateRoutinePickups.js";
import pickupRoutes from "./routes/app/pickupRoutes.js";
import feedbackRoutes from "./routes/app/feedbackRoutes.js";
import taskRoutes from "./routes/admin/taskRoutes.js";
import employeeRoutes from "./routes/admin/employeeRoutes.js";
import appEmployeeRoutes from "./routes/app/employeeRoutes.js";
import attendenceRoutes from "./routes/admin/attendenceRoutes.js";
import notificationSettingRoutes from "./routes/app/notificationSettingRoutes.js";
import { startArchiveCleanupJob } from "./jobs/archiveCleanup.js";
import adminFeedbackRoutes from "./routes/admin/adminFeedbackRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
connectDB();

const corsOptions = {
  // origin: "https://zor-admin.vercel.app", // Or your frontend origin
  origin: "http://localhost:3005", // Or your frontend origin
  credentials: true, // If you're sending cookies/auth headers
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json());

app.use(cors(corsOptions));
const port = process.env.PORT || 3001;
app.use(morgan("combined"));
app.use(express.urlencoded({ extended: true }));
app.use(
  "/public",
  express.static(
    path.join(path.dirname(new URL(import.meta.url).pathname), "public")
  )
);
const viewsPath =
  process.env.NODE_ENV === "production"
    ? path.join(__dirname, "views")
    : path.join(__dirname, "..", "src", "views");
app.set("views", viewsPath);
app.set("view engine", "ejs");

app.get("/", (req: Request, res: Response) => {
  const deviceType = req.headers["x-device-type"];
  console.log("deviceType", deviceType);
  res.send(`Server is listning on port ${port}`);
});
// startArchiveCleanupJob();
// generateRoutinePickupsJob();

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/complaint", complaintRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/admin/users", adminRoutes);
app.use("/api/v1/admin/property", propertyRoutes);
app.use("/api/v1/admin/tasks", taskRoutes);
app.use("/api/v1/admin/employees", employeeRoutes);
app.use("/api/v1/pickup", pickupRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/employee", appEmployeeRoutes);
app.use("/api/v1/admin/attendence", attendenceRoutes);
app.use("/api/v1/notification-settings", notificationSettingRoutes);
app.use("/api/v1/admin/feedback", adminFeedbackRoutes);
// app.use("/api/v1", googleMeetRoutes);
app.use(errorHandler);
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  server.close(() => {
    process.exit(1);
  });
});
