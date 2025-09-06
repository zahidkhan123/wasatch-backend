// Centralized timezone configuration
// This file provides a single source of truth for the application timezone
import dotenv from "dotenv";
dotenv.config();

export const APP_TZ = process.env.APP_TZ || "America/Denver";

// Validate that the timezone is valid
export const validateTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

// Get the current timezone (with fallback validation)
export const getAppTimezone = (): string => {
  if (validateTimezone(APP_TZ)) {
    return APP_TZ;
  }

  console.warn(
    `Invalid timezone "${APP_TZ}" in environment variable APP_TZ. Falling back to "America/Denver".`
  );
  return "America/Denver";
};

// Export the validated timezone
export const APPLICATION_TIMEZONE = getAppTimezone();
