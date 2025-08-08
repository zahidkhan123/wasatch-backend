import Joi from "joi";

export const createComplaintSchema = Joi.object({
  subject: Joi.string().optional(),
  description: Joi.string().optional(),
  media_url: Joi.array().items(Joi.string()).optional(),
});
