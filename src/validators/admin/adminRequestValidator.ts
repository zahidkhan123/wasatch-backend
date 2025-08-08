import Joi from "joi";
import { objectIdValidator } from "../../helpers/helperFunctions.js";
export const categoryValidationSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": '"name" should be a type of text',
    "string.empty": '"name" cannot be an empty field',
    "string.min": '"name" should have a minimum length of 3',
    "string.max": '"name" should have a maximum length of 50',
    "any.required": '"name" is a required field',
  }),
  icon: Joi.string().required().messages({
    "string.base": '"icon" should be a type of text',
    "string.empty": '"icon" cannot be an empty field',
    "any.required": '"icon" is a required field',
  }),
  is_active: Joi.boolean().required().messages({
    "boolean.base": '"is_active" should be a boolean value',
    "any.required": '"is_active" is a required field',
  }),
});

export const specializationValidationSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": '"name" should be a type of text',
    "string.empty": '"name" cannot be an empty field',
    "string.min": '"name" should have a minimum length of 3',
    "string.max": '"name" should have a maximum length of 50',
    "any.required": '"name" is a required field',
  }),
  category: Joi.string()
    .custom(objectIdValidator, "ObjectId validation")
    .required()
    .messages({
      "string.empty": '"category" cannot be an empty field',
      "any.required": '"category" is a required field',
    }),
  is_active: Joi.boolean().required().messages({
    "boolean.base": '"is_active" should be a boolean value',
    "any.required": '"is_active" is a required field',
  }),
});

export const servicesValidationSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": '"name" should be a type of text',
    "string.empty": '"name" cannot be an empty field',
    "string.min": '"name" should have a minimum length of 3',
    "string.max": '"name" should have a maximum length of 50',
    "any.required": '"name" is a required field',
  }),
  category: Joi.string()
    .custom(objectIdValidator, "ObjectId validation")
    .required()
    .messages({
      "string.empty": '"category" cannot be an empty field',
      "any.required": '"category" is a required field',
    }),
  is_active: Joi.boolean().required().messages({
    "boolean.base": '"is_active" should be a boolean value',
    "any.required": '"is_active" is a required field',
  }),
});

export const skillValidationSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": '"name" should be a type of text',
    "string.empty": '"name" cannot be an empty field',
    "string.min": '"name" should have a minimum length of 3',
    "string.max": '"name" should have a maximum length of 50',
    "any.required": '"name" is a required field',
  }),

  is_active: Joi.boolean().required().messages({
    "boolean.base": '"is_active" should be a boolean value',
    "any.required": '"is_active" is a required field',
  }),
});

export const updateCategoryValidationSchema = categoryValidationSchema.fork(
  ["name", "icon", "is_active"],
  (field) => field.optional()
);

export const updateSpecializationValidationSchema =
  specializationValidationSchema.fork(["name", "is_active"], (field) =>
    field.optional()
  );

export const updateServicesValidationSchema = servicesValidationSchema.fork(
  ["name", "is_active"],
  (field) => field.optional()
);

export const updateSkillValidationSchema = skillValidationSchema.fork(
  ["name", "is_active"],
  (field) => field.optional()
);

export const dropdownValidationSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": '"name" should be a type of text',
    "string.empty": '"name" cannot be an empty field',
    "string.min": '"name" should have a minimum length of 3',
    "string.max": '"name" should have a maximum length of 50',
    "any.required": '"name" is a required field',
  }),
  type: Joi.string().required().messages({
    "string.base": '"type" should be a type of text',
    "string.empty": '"type" cannot be an empty field',
    "any.required": '"type" is a required field',
  }),
  is_active: Joi.boolean().required().messages({
    "boolean.base": '"is_active" should be a boolean value',
    "any.required": '"is_active" is a required field',
  }),
});

export const updateDropdownValidationSchema = dropdownValidationSchema.fork(
  ["name", "type", "is_active"],
  (field) => field.optional()
);
