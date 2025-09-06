import Joi from "joi";

export const createPropertySchema = Joi.object({
  name: Joi.string().min(3).max(30).required().messages({
    "string.empty": "Property name is required",
    "any.required": "Property name is required",
    "string.min": "Property name must be at least 3 characters",
    "string.max": "Property name cannot exceed 30 characters",
  }),
  emailAddress: Joi.string().email().min(5).max(30).required().messages({
    "string.empty": "Email address is required",
    "any.required": "Email address is required",
    "string.email": "Invalid email address",
  }),
  managerName: Joi.string().min(2).max(15).required().messages({
    "string.empty": "Manager name is required",
    "any.required": "Manager name is required",
  }),
  phone: Joi.string()
    .pattern(/^[0-9+-\s()]{7,20}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number format is invalid",
      "any.required": "Phone number is required",
      "string.empty": "Phone number is required",
    }),
  units: Joi.number().integer().min(1).required().messages({
    "number.base": "Units must be a number",
    "number.integer": "Units must be an integer",
    "number.min": "There must be at least one unit",
    "any.required": "Number of units is required",
  }),
  accessCode: Joi.string().min(4).max(20).required().messages({
    "string.empty": "Access code is required",
    "any.required": "Access code is required",
  }),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }),
  isPaid: Joi.boolean().required().messages({
    "any.required": "Is paid is required",
  }),
});

export const updatePropertySchema = Joi.object({
  name: Joi.string().min(3).max(100).optional().messages({
    "string.min": "Property name must be at least 3 characters",
    "string.max": "Property name cannot exceed 100 characters",
  }),
  emailAddress: Joi.string().email().min(5).max(30).optional().messages({
    "string.min": "Email address must be at least 5 characters",
    "string.max": "Email address cannot exceed 30 characters",
    "string.email": "Invalid email address",
  }),
  managerName: Joi.string().min(2).max(15).optional().messages({
    "string.min": "Manager name must be at least 2 characters",
    "string.max": "Manager name cannot exceed 15 characters",
  }),
  phone: Joi.string()
    .pattern(/^[0-9+-\s()]{7,20}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone number format is invalid",
    }),
  units: Joi.number().integer().min(1).optional().messages({
    "number.base": "Units must be a number",
    "number.integer": "Units must be an integer",
    "number.min": "There must be at least one unit",
  }),
  accessCode: Joi.string().min(4).max(20).optional().messages({
    "string.min": "Access code must be at least 4 characters",
    "string.max": "Access code cannot exceed 20 characters",
  }),
  location: Joi.object({
    lat: Joi.number().optional(),
    lng: Joi.number().optional(),
  }),
  isPaid: Joi.boolean().optional(),
});
