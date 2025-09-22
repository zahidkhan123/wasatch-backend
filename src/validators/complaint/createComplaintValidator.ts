import Joi from "joi";
import { objectIdValidator } from "../../helpers/helperFunctions.js";

export const createComplaintSchema = Joi.object({
  subject: Joi.string().optional(),
  description: Joi.string().optional(),
  media_url: Joi.array().items(Joi.string()).optional(),
});

export const updateComplaintSchema = Joi.object({
  id: Joi.string().required(),
  status: Joi.string().required().valid("resolved", "closed"),
});
