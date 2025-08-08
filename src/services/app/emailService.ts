// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   host: "smtpout.secureserver.net",
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// export const sendOTP = async (email: string, otp: string) => {
//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: "Your OTP Code",
//     text: `Your OTP code is ${otp}`,
//   };

//   await transporter.sendMail(mailOptions);
// };
import Queue from "bull";
import { redisConfig } from "../../config/redisConfig.js";

const emailQueue = new Queue("emailQueue", { redis: redisConfig });

export const sendEmailJob = async (
  type: "otp" | "registration-status",
  email: string,
  subject: string,
  payload: { otp?: string; status?: string; message?: string }
) => {
  console.log("Sending email job to queue");
  await emailQueue.add(
    {
      type,
      email,
      subject: type === "otp" ? "Your OTP Code" : "Your Registration Status",
      ...payload,
    },
    {
      attempts: 3, // Retry 3 times
      backoff: 5000, // 5-second delay between retries
      removeOnComplete: true,
    }
  );
  console.log(`Email job added to queue for: ${email}`);
};
