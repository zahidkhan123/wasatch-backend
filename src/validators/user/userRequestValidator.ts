import Joi from "joi";
import { objectIdValidator } from "../../helpers/helperFunctions.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

export const registerUserValidationSchema = Joi.object({
  name: Joi.string().required().max(25).messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
    "any.required": "Name is required",
    "string.max": "Name cannot exceed 100 characters",
  }),
  email: Joi.string().required().email().max(30).messages({
    "string.base": "Email must be a string",
    "string.empty": "Email is required",
    "any.required": "Email is required",
    "string.email": "Email must be valid",
    "string.max": "Email cannot exceed 30 characters",
  }),
  password: Joi.string().required().min(4).max(20).messages({
    "string.base": "Password must be a string",
    "string.empty": "Password is required",
    "any.required": "Password is required",
    "string.min": "Password must be at least 4 characters long",
    "string.max": "Password cannot exceed 20 characters",
  }),
  accessCode: Joi.string().required().messages({
    "string.base": "Access code must be a string",
    "string.empty": "Access code is required",
    "any.required": "Access code is required",
  }),
  firstName: Joi.string().optional().max(10).messages({
    "string.base": "First name must be a string",
    "string.max": "First name cannot exceed 10 characters",
  }),
  lastName: Joi.string().optional().max(10).messages({
    "string.base": "Last name must be a string",
    "string.max": "Last name cannot exceed 10 characters",
  }),
  property: Joi.string()
    .optional()
    .custom(objectIdValidator, "ObjectId validation")
    .messages({
      "string.base": "Property ID must be a string",
    }),
  buildingNumber: Joi.string().optional().max(20).messages({
    "string.base": "Building number must be a string",
    "string.max": "Building number cannot exceed 20 characters",
  }),
  unitNumber: Joi.string().optional().max(20).messages({
    "string.base": "Unit number must be a string",
    "string.max": "Unit number cannot exceed 20 characters",
  }),
});

export const pickupRequestSchema = Joi.object({
  scheduledDate: Joi.string()
    .required()
    .custom((value, helpers) => {
      // Application timezone check

      dayjs.extend(utc);
      dayjs.extend(timezone);

      const tz = process.env.APP_TZ || "America/Denver";
      const nowNY = dayjs().tz(tz).startOf("day");
      const inputDate = dayjs.tz(value, tz).startOf("day");

      if (!inputDate.isValid()) {
        return helpers.error("date.base");
      }
      if (inputDate.isBefore(nowNY)) {
        return helpers.error("date.min");
      }
      return value;
    }, "Application timezone date validation")
    .messages({
      "any.required": "Scheduled date is required",
      "date.base": "Scheduled date must be a valid date",
      "date.empty": "Scheduled date is required",
      "date.min": "Scheduled date cannot be in the past.",
    }),
  timeSlot: Joi.string().required().messages({
    "string.base": "Time slot must be a string",
    "string.empty": "Time slot is required",
    "any.required": "Time slot is required",
  }),
  specialInstructions: Joi.string().optional().max(200).messages({
    "string.base": "Special instructions must be a string",
    "string.max": "Special instructions cannot exceed 200 characters",
  }),
});

export const feedbackValidationSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.base": "Rating must be a number",
    "number.min": "Rating must be at least 1",
    "number.max": "Rating must not exceed 5",
    "any.required": "Rating is required",
  }),
  pickupTimes: Joi.boolean().required().messages({
    "boolean.base": "Pickup Times must be a boolean",
    "any.required": "Pickup Times is required",
  }),
  supportSystem: Joi.boolean().required().messages({
    "boolean.base": "Support System must be a boolean",
    "any.required": "Support System is required",
  }),
  staffPerformance: Joi.boolean().required().messages({
    "boolean.base": "Staff Performance must be a boolean",
    "any.required": "Staff Performance is required",
  }),
  comment: Joi.string().max(500).optional().allow("").messages({
    "string.base": "Comment must be a string",
    "string.max": "Comment cannot exceed 500 characters",
  }),
});

export const updateUserProfileSchema = Joi.object({
  profile: Joi.object({
    firstName: Joi.string().min(2).max(20).optional().messages({
      "string.empty": "First name is required",
    }),
    lastName: Joi.string().min(2).max(20).optional().messages({
      "string.empty": "Last name is required",
    }),
    phoneNumber: Joi.string()
      .optional()
      .regex(/^[0-9+-\s()]+$/)
      .messages({
        "string.pattern.base": "Phone number format is invalid",
      }),
  }).optional(),
  avatarUrl: Joi.string().optional(),
  property: Joi.string()
    .custom(objectIdValidator, "ObjectId validation")
    .optional()
    .messages({
      "string.pattern.base": "Invalid Property ID",
      "any.required": "Property is required",
    }),
  buildingNumber: Joi.string().optional().messages({
    "string.empty": "Building number is required",
  }),
  unitNumber: Joi.string().optional().messages({
    "string.empty": "Unit number is required",
  }),
});

export const updateEmployeeProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(20).optional().messages({
    "string.base": "First name must be a string",
    "string.empty": "First name is required",
    "string.min": "First name must be at least 2 characters",
    "string.max": "First name cannot exceed 20 characters",
  }),
  lastName: Joi.string().min(2).max(20).optional().messages({
    "string.base": "Last name must be a string",
    "string.empty": "Last name is required",
    "string.min": "Last name must be at least 2 characters",
    "string.max": "Last name cannot exceed 20 characters",
  }),
  phone: Joi.string()
    .optional()
    .regex(/^[0-9+-\s()]+$/)
    .messages({
      "string.pattern.base": "Phone number format is invalid",
      "string.base": "Phone number must be a string",
    }),
  avatarUrl: Joi.string().optional().messages({
    "string.base": "Avatar URL must be a string",
  }),
});
