import Joi from "joi";
import { UserType } from "../../types/enums.js";
import { objectIdValidator } from "../../helpers/helperFunctions.js";
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// export const createUserSchema = Joi.object({
//   name: Joi.string()
//     .required()
//     .max(50)
//     .regex(/^[a-zA-Z0-9\s]+$/)
//     .messages({
//       "string.pattern.base":
//         "Name can only contain letters, numbers and spaces",
//       "any.required": "Name is required",
//     }),
//   user_type: Joi.string()
//     .valid(UserType.ADMIN, UserType.User, UserType.EMPLOYEE)
//     .required()
//     .messages({
//       "any.only": "Invalid user type",
//       "any.required": "User type is required",
//     }),
//   referral_code: Joi.string()
//     .optional()
//     .max(15)
//     .messages({
//       "string.max": "Referral code cannot exceed 15 characters",
//     })
//     .when("user_type", {
//       is: UserType.ADMIN,
//       then: Joi.string().required().messages({
//         "any.required": "Referral code is required",
//       }),
//     }),
//   dob: Joi.date().required().messages({
//     "date.base": "Invalid date format",
//     "any.required": "Date of birth is required",
//   }),
//   email: Joi.string()
//     .email()
//     .required()
//     .max(50)
//     .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
//     .messages({
//       "string.pattern.base": "Invalid email address",
//       "string.email": "Invalid email format",
//       "any.required": "Email is required",
//     }),
//   phone: Joi.string()
//     .max(50)
//     .regex(/^[0-9+\-\s()]+$/)
//     .required()
//     .messages({
//       "string.pattern.base": "Invalid phone number format",
//       "any.required": "Phone number is required",
//     }),
//   whatsapp: Joi.string()
//     .max(50)
//     .regex(/^[0-9+\-\s()]+$/)
//     .required()
//     .messages({
//       "string.pattern.base": "Invalid WhatsApp number format",
//       "any.required": "WhatsApp number is required",
//     }),
//   password: Joi.string().required().min(4).max(20).messages({
//     "string.min": "Password must be at least 4 characters long",
//     "string.max": "Password cannot exceed 20 characters",
//     "any.required": "Password is required",
//   }),
//   image: Joi.when("user_type", {
//     is: UserType.LAWYER,
//     then: Joi.string().required().messages({
//       "string.empty": "Image is required",
//       "any.required": "Image is required",
//     }),
//     otherwise: Joi.string().optional().empty(""),
//   }),
//   gender_id: Joi.string().regex(objectIdPattern).required().messages({
//     "string.empty": "required",
//     "any.required": "required",
//   }),
// });

export const loginSchema = Joi.object({
  email: Joi.string()
    .required()
    .max(50)
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .messages({
      "string.pattern.base": "please enter valid email address",
      "any.required": "please enter valid email address",
      "string.max": "please enter valid email address",
      "string.empty": "please enter valid email address",
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
  role: Joi.string().valid(UserType.ADMIN).required().messages({
    "any.required": "Role is required",
  }),
});
