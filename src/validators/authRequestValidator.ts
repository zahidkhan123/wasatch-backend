import Joi from "joi";
import { UserType } from "../types/enums.js";

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  password: Joi.string()
    .required()
    .min(8)
    .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  user_type: Joi.string().valid("guest", "lawyer").required(),
});

export const verifyOtpSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  otp: Joi.string()
    .required()
    .regex(/^[0-9]+$/),
  role: Joi.string().valid(UserType.USER).required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  newPassword: Joi.string()
    .min(6)
    .max(50)
    .required()
    .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/),
  user_type: Joi.string().valid("guest", "lawyer").required(),
});
