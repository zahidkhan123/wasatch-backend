import joi from "joi";
import { objectIdValidator } from "../../helpers/helperFunctions.js";
export const assignTaskToEmployeeSchema = joi.object({
  unitNumber: joi.string().min(1).max(100).required().messages({
    "string.base": "Unit number must be a string.",
    "string.empty": "Unit number is required.",
    "any.required": "Unit number is required.",
  }),
  buildingName: joi.string().min(1).max(100).required().messages({
    "string.base": "Building name must be a string.",
    "string.empty": "Building name is required.",
    "any.required": "Building name is required.",
  }),
  apartmentName: joi.string().min(1).max(100).required().messages({
    "string.base": "Apartment name must be a string.",
    "string.empty": "Apartment name is required.",
    "any.required": "Apartment name is required.",
  }),
  propertyId: joi
    .string()
    .custom(objectIdValidator, "ObjectId validation")
    .required()
    .messages({
      "string.base": "Property ID must be a string.",
      "string.empty": "Property ID is required.",
      "any.required": "Property ID is required.",
    }),
  employeeId: joi
    .string()
    .custom(objectIdValidator, "ObjectId validation")
    .required()
    .messages({
      "string.base": "Employee ID must be a string.",
      "string.empty": "Employee ID is required.",
      "any.required": "Employee ID is required.",
    }),
  scheduledDate: joi
    .string()
    .isoDate()
    .required()
    .custom((value, helpers) => {
      const inputDate = new Date(value);
      const now = new Date();
      // Set both dates to midnight for date-only comparison
      inputDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      if (inputDate < now) {
        return helpers.error("date.min", {
          limit: now.toISOString().split("T")[0],
        });
      }
      return value;
    }, "Future or today date validation")
    .messages({
      "string.base": "Scheduled date must be a string in ISO format.",
      "string.empty": "Scheduled date is required.",
      "any.required": "Scheduled date is required.",
      "string.isoDate": "Scheduled date must be in ISO format (YYYY-MM-DD).",
      "date.min": "Scheduled date must be today or a future date.",
    }),
  timeSlot: joi.string().required().messages({
    "string.base": "Time slot must be a string.",
    "string.empty": "Time slot is required.",
    "any.required": "Time slot is required.",
  }),
  specialInstructions: joi.string().optional().allow("").messages({
    "string.base": "Special instructions must be a string.",
  }),
  isTemporaryAssignment: joi.boolean().optional().allow("").messages({
    "boolean.base": "Is temporary assignment must be a boolean.",
    "boolean.empty": "Is temporary assignment is required.",
    "any.required": "Is temporary assignment is required.",
  }),
  // tempAssignmentEndDate: joi.string().isoDate().optional().allow("").messages({
  //   "string.base":
  //     "Temporary assignment end date must be a string in ISO format.",
  //   "string.empty": "Temporary assignment end date is required.",
  //   "any.required": "Temporary assignment end date is required.",
  // }),
});
