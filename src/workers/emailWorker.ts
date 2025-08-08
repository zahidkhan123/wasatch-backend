import Queue from "bull";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { transporter } from "../config/nodemailerConfig.js";
import { redisConfig } from "../config/redisConfig.js";

dotenv.config();

const emailQueue = new Queue("emailQueue", { redis: redisConfig });

// Helper: Read and replace placeholders for OTP template
const getOtpTemplate = (otp: string): string => {
  const filePath = path.join(
    process.cwd(),
    "src",
    "templates",
    "otpTemplate.html"
  );
  const html = fs.readFileSync(filePath, "utf-8");
  return html.replace("{{OTP}}", otp);
};

// Helper: Read and replace placeholders for registration status template
const getRegistrationStatusTemplate = (
  type: "otp" | "registration-status",
  email: string,
  status: "Approved" | "Rejected" | "Pending",
  message: string
): string => {
  const filePath = path.join(
    process.cwd(),
    "src",
    "templates",
    "registrationTemplate.html"
  );
  const html = fs.readFileSync(filePath, "utf-8");

  const statusColorMap: Record<string, string> = {
    Approved: "#28a745",
    Rejected: "#dc3545",
    Pending: "#FFA501",
  };

  return html
    .replace("{{STATUS}}", status)
    .replace("{{STATUS_COLOR}}", statusColorMap[status])
    .replace("{{MESSAGE}}", message);
};

// Worker processor
emailQueue.process(async (job) => {
  const { type, email, subject, ...payload } = job.data;

  let htmlContent: string;

  if (type === "otp") {
    const { otp } = job.data;
    htmlContent = getOtpTemplate(otp);
  } else if (type === "registration-status") {
    const { status, message } = payload;
    htmlContent = getRegistrationStatusTemplate(type, email, status, message);
  } else {
    throw new Error("Unknown email job type");
  }

  const mailOptions = {
    from: `Wasatch Waste Management <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to: ${email}`);
  } catch (error) {
    console.error(`Failed to send email: ${job.id}`, error);
    throw error; // Job will retry
  }
});

// Events
emailQueue.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

emailQueue.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed`, err);
});

// import Queue from "bull";
// import fs from "fs";
// import path from "path";
// import { transporter } from "../config/nodemailerConfig.js";
// import { redisConfig } from "../config/redisConfig.js";
// import dotenv from "dotenv";
// dotenv.config();
// // Initialize the email queue
// const emailQueue = new Queue("emailQueue", { redis: redisConfig });

// // Read and replace placeholders in the HTML template
// const getHtmlTemplate = (otp: string): string => {
//   const filePath = path.join(
//     process.cwd(),
//     "src",
//     "templates",
//     "otpTemplate.html"
//   );
//   const html = fs.readFileSync(filePath, "utf-8");
//   return html.replace("{{OTP}}", otp);
// };

// const getRegistrationStatusHtml = (
//   status: "Approved" | "Rejected" | "Pending",
//   message: string
// ): string => {
//   const filePath = path.join(
//     process.cwd(),
//     "src",
//     "templates",
//     "registrationTemplate.html"
//   );

//   const statusColorMap = {
//     Approved: "#28a745",
//     Rejected: "#dc3545",
//     Pending: "#FFA501",
//   };

//   let html = fs.readFileSync(filePath, "utf-8");

//   html = html
//     .replace("{{STATUS}}", status)
//     .replace("{{STATUS_COLOR}}", statusColorMap[status])
//     .replace("{{MESSAGE}}", message);

//   return html;
// };

// // Worker to process email jobs
// emailQueue.process(async (job) => {
//   const { email, otp, subject } = job.data;

//   const htmlContent = getHtmlTemplate(otp);
//   const mailOptions = {
//     from: `ZOR <${process.env.EMAIL_FROM}>`,
//     to: email,
//     subject: subject,
//     html: htmlContent,
//   };
//   try {
//     await transporter.sendMail(mailOptions);
//     console.log(`Email sent successfully to: ${email}`);
//   } catch (error) {
//     console.error(`Failed to send email: ${job.id}`, error);
//     throw error; // Ensure the job is retried
//   }
// });

// // Event listener for job completion
// emailQueue.on("completed", (job) => {
//   console.log(`Job ${job.id} completed successfully`);
// });

// // Event listener for job failure
// emailQueue.on("failed", (job, err) => {
//   console.error(`Job ${job.id} failed`, err);
// });
