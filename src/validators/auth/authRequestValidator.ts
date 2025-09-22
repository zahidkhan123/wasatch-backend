import Joi from "joi";
import { UserType } from "../../types/enums.js";
import { objectIdValidator } from "../../helpers/helperFunctions.js";

export const registerUserSchema = Joi.object({
  email: Joi.string().email().max(30).required().messages({
    "string.email": "Invalid email address",
    "string.empty": "Email is required",
  }),
  password: Joi.string().min(6).max(30).required().messages({
    "string.min": "Password must be at least 6 characters",
    "string.max": "Password cannot exceed 30 characters",
    "any.required": "Password is required",
  }),
  profile: Joi.object({
    firstName: Joi.string().min(2).max(10).required().messages({
      "string.empty": "First name is required",
    }),
    lastName: Joi.string().min(2).max(10).required().messages({
      "string.empty": "Last name is required",
    }),
    phoneNumber: Joi.string()
      .optional()
      .regex(/^[0-9+-\s()]+$/)
      .messages({
        "string.pattern.base": "Phone number format is invalid",
      }),
    avatarUrl: Joi.string().uri().optional(),
  }).required(),
  property: Joi.string()
    .custom(objectIdValidator, "ObjectId validation")
    .required()
    .messages({
      "string.pattern.base": "Invalid Property ID",
      "any.required": "Property is required",
    }),
  buildingNumber: Joi.string().optional().messages({
    "string.empty": "Building name or number is required",
  }),
  unitNumber: Joi.string().required().messages({
    "string.empty": "Unit number is required",
  }),

  accessCode: Joi.string().required().messages({
    "string.empty": "Access code is required",
    "any.required": "Access code is required",
  }),

  // notifications: Joi.object({
  //   push: Joi.boolean().optional(),
  //   email: Joi.boolean().optional(),
  // }).optional(),
  role: Joi.string().valid("user").required(),
});

export const registerAdminSchema = Joi.object({
  name: Joi.string().min(2).max(20).required().messages({
    "string.empty": "Name is required",
  }),
  email: Joi.string().email().max(50).required().messages({
    "string.email": "Invalid email address",
    "string.empty": "Email is required",
  }),
  password: Joi.string().min(6).max(30).required().messages({
    "string.min": "Password must be at least 6 characters",
    "string.max": "Password cannot exceed 30 characters",
    "any.required": "Password is required",
  }),
  role: Joi.string().valid(UserType.ADMIN).required().messages({
    "any.required": "Role is required",
  }),
});

export const registerEmployeeSchema = Joi.object({
  firstName: Joi.string().min(2).max(10).required().messages({
    "string.empty": "First name is required",
  }),
  lastName: Joi.string().min(2).max(10).required().messages({
    "string.empty": "Last name is required",
  }),
  email: Joi.string().email().max(50).required().messages({
    "string.email": "Invalid email address",
    "string.empty": "Email is required",
  }),
  phone: Joi.string()
    .regex(/^[0-9+-\s()]+$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid phone number",
      "string.empty": "Phone number is required",
    }),
  employeeId: Joi.string().max(30).required().messages({
    "string.empty": "Employee ID is required",
    "string.alphanum": "Employee ID must be alphanumeric",
  }),
  password: Joi.string().min(6).max(30).required().messages({
    "string.min": "Password must be at least 6 characters",
    "string.max": "Password cannot exceed 30 characters",
    "any.required": "Password is required",
  }),
  assignedArea: Joi.string()
    .custom(objectIdValidator, "ObjectId validation")
    .messages({
      "string.pattern.base": "Invalid property ID",
    }),
  role: Joi.string().valid("employee").required().messages({
    "any.required": "Role is required",
  }),
  active: Joi.boolean().optional(),
  // Allow shiftStart and shiftEnd to be in 24-hour or 12-hour (AM/PM) format
  shiftStart: Joi.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.empty": "Shift start time is required",
      "string.pattern.base":
        "Invalid shift start time. Use HH:mm (24-hour) format, e.g., 09:00 or 13:00.",
    }),
  shiftEnd: Joi.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.empty": "Shift end time is required",
      "string.pattern.base":
        "Invalid shift end time. Use HH:mm (24-hour) format, e.g., 09:00 or 13:00.",
    }),
});

export const verifyPropertySchema = Joi.object({
  property: Joi.string()
    .custom(objectIdValidator, "ObjectId validation")
    .required()
    .messages({
      "string.pattern.base": "Invalid Property ID",
      "any.required": "Property is required",
    }),
  accessCode: Joi.string().required().messages({
    "string.empty": "Access code is required",
    "any.required": "Access code is required",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .required()
    .max(50)
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .messages({
      "string.pattern.base": "Invalid Email",
      "any.required": "Invalid Email",
      "string.max": "Invalid Email",
      "string.empty": "Invalid Email",
    })
    .custom((value, helpers) => {
      const tlds = [
        ".com",
        ".net",
        ".org",
        ".edu",
        ".gov",
        ".io",
        ".co",
        ".me",
        ".info",
        ".biz",
      ];
      const hasValidTld = tlds.some((tld) => value.toLowerCase().endsWith(tld));
      if (!hasValidTld) {
        return helpers.error("string.pattern.base");
      }
      return value;
    }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
  role: Joi.string()
    .valid(UserType.USER, UserType.EMPLOYEE)
    .required()
    .messages({
      "any.required": "Role is required",
    }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .required()
    .max(50)
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .messages({
      "string.pattern.base": "Invalid Email",
      "any.required": "Invalid Email",
      "string.max": "Invalid Email",
      "string.empty": "Invalid Email",
    })
    .custom((value, helpers) => {
      const tlds = [
        ".com",
        ".net",
        ".org",
        ".edu",
        ".gov",
        ".io",
        ".co",
        ".me",
        ".info",
        ".biz",
      ];
      const hasValidTld = tlds.some((tld) => value.toLowerCase().endsWith(tld));
      if (!hasValidTld) {
        return helpers.error("string.pattern.base");
      }
      return value;
    }),
  role: Joi.string().valid(UserType.USER).required().messages({
    "any.required": "Role is required",
  }),
});

export const verifyOtpSchema = Joi.object({
  email: Joi.string()
    .required()
    .max(50)
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .messages({
      "string.pattern.base": "Invalid Email",
      "any.required": "Invalid Email",
      "string.max": "Invalid Email",
      "string.empty": "Invalid Email",
    })
    .custom((value, helpers) => {
      const tlds = [
        ".com",
        ".net",
        ".org",
        ".edu",
        ".gov",
        ".io",
        ".co",
        ".me",
        ".info",
        ".biz",
      ];
      const hasValidTld = tlds.some((tld) => value.toLowerCase().endsWith(tld));
      console.log(hasValidTld);
      if (!hasValidTld) {
        return helpers.error("string.pattern.base");
      }
      console.log(value);
      return value;
    }),
  otp: Joi.string()
    .required()
    .regex(/^[0-9]+$/),
  role: Joi.string().valid(UserType.USER).required().messages({
    "any.required": "Role is required",
  }),
  verify_email: Joi.boolean().optional(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .required()
    .max(50)
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .messages({
      "string.pattern.base": "Invalid Email",
      "any.required": "Invalid Email",
      "string.max": "Invalid Email",
      "string.empty": "Invalid Email",
    })
    .custom((value, helpers) => {
      const tlds = [
        ".com",
        ".net",
        ".org",
        ".edu",
        ".gov",
        ".io",
        ".co",
        ".me",
        ".info",
        ".biz",
      ];
      const hasValidTld = tlds.some((tld) => value.toLowerCase().endsWith(tld));
      if (!hasValidTld) {
        return helpers.error("string.pattern.base");
      }
      return value;
    }),
  newPassword: Joi.string().required().min(4).max(20).messages({
    "string.min": "Password must be at least 4 characters long",
    "string.max": "Password cannot exceed 20 characters",
    "any.required": "Password is required",
  }),
  role: Joi.string().valid(UserType.USER).required().messages({
    "any.required": "Role is required",
  }),
});

export const verifyEmailSchema = Joi.object({
  email: Joi.string()
    .required()
    .max(50)
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .messages({
      "string.pattern.base": "Invalid Email",
      "any.required": "Invalid Email",
      "string.max": "Invalid Email",
      "string.empty": "Invalid Email",
    })
    .custom((value, helpers) => {
      const tlds = [
        ".com",
        ".net",
        ".org",
        ".edu",
        ".gov",
        ".io",
        ".co",
        ".me",
        ".info",
        ".biz",
      ];
      const hasValidTld = tlds.some((tld) => value.toLowerCase().endsWith(tld));
      if (!hasValidTld) {
        return helpers.error("string.pattern.base");
      }
      return value;
    }),
});
