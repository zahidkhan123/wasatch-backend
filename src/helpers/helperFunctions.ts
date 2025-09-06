import crypto from "crypto";
import dayjs from "dayjs";
import Joi from "joi";
import { Types } from "mongoose";

const generateOTP = () => {
  const otp = crypto.randomInt(1000, 9999);
  return otp;
};

const objectIdValidator = (value: string, helpers: Joi.CustomHelpers) => {
  if (!Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

const getDayRangeInTZ = (
  date: string,
  tz = process.env.APP_TZ || "America/Denver"
) => {
  return {
    start: dayjs.tz(date, tz).startOf("day").toDate(),
    end: dayjs.tz(date, tz).endOf("day").toDate(),
  };
};

const sortDays = (days: { name: string }[]): { name: string }[] => {
  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return days.sort(
    (a, b) => dayOrder.indexOf(a.name) - dayOrder.indexOf(b.name)
  );
};

const generateReferenceNumber = () => {
  const randomString = crypto.randomBytes(3).toString("hex");
  const timestamp = Date.now();
  const referenceNumber = `REF-${timestamp}-${randomString}`;
  return referenceNumber;
};

const formatPakPhoneNumber = (phone?: string): string | null => {
  if (!phone) return null;

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");

  // If it already starts with 92, return it as-is
  if (digitsOnly.startsWith("92")) {
    return digitsOnly;
  }

  // Remove leading 0s and prefix with 92
  return `92${digitsOnly.replace(/^0+/, "")}`;
};

export {
  generateOTP,
  objectIdValidator,
  sortDays,
  generateReferenceNumber,
  formatPakPhoneNumber,
  getDayRangeInTZ,
};
