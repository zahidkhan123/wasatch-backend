import Joi from "joi";
import { objectIdValidator } from "../../helpers/helperFunctions.js";

export const issueReportValidator = Joi.object({
  taskId: Joi.string().optional().messages({
    "string.base": "Task ID must be a string.",
    "string.empty": "Task ID is optional.",
  }),
  issueType: Joi.string().required().messages({
    "string.base": "Issue type must be a string.",
    "string.empty": "Issue type is required.",
    "any.required": "Issue type is required.",
  }),
  mediaUrl: Joi.array()
    .items(
      Joi.string().messages({
        "string.base": "Each attachment must be a string.",
      })
    )
    .optional()
    .messages({
      "array.base": "Attachments must be an array of strings.",
    }),
  description: Joi.string().optional().messages({
    "string.base": "Description must be a string.",
    "string.empty": "Description is optional.",
  }),
});
