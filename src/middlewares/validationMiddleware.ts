// import { Request, Response, NextFunction } from "express";
// import Joi from "joi";
// import { useErrorResponse } from "../utils/apiResponse.js";

// export const validationMiddleware = (
//   schema: Joi.ObjectSchema,
//   dataSource: "body" | "query" | "params" = "body"
// ) => {
//   return (req: Request, res: Response, next: NextFunction): void => {
//     const { error } = schema.validate(req[dataSource], { abortEarly: false });

//     if (error) {
//       const errorMessages = error?.details.map((err) => {
//         const field = err.path[0];
//         const message = err.message;

//         if (message.includes("is required")) {
//           return `${String(field).replace(/_/g, " ")} is required.`;
//         } else if (message.includes("must be one of")) {
//           const possibleValues = message.match(/\[(.*?)\]/)?.[1];
//           return `${String(field).replace(/_/g, " ")} must be one of [${possibleValues}].`;
//         }
//         return message;
//       });

//       if (errorMessages && errorMessages.length) {
//         const lastMessage = errorMessages.pop();
//         const message = errorMessages.length
//           ? `${errorMessages.join(", ")} and ${lastMessage}`
//           : `${lastMessage}`;

//         useErrorResponse(res, message, 422);
//       } else {
//         useErrorResponse(res, "Invalid input.", 422);
//       }

//       return;
//     }

//     return next();
//   };
// };
import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { useErrorResponse } from "../utils/apiResponse.js";

export const validationMiddleware = (
  schema: Joi.ObjectSchema,
  dataSource: "body" | "query" | "params" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req[dataSource], { abortEarly: false });

    if (error) {
      // Generate formatted error messages
      const errorMessages = error.details.map(({ path, message }) => {
        const fieldPath = path.join("."); // Convert path array to string, e.g., lawyer_locations[0].city
        const formattedField = fieldPath.replace(/_/g, " "); // Replace underscores with spaces for readability

        if (message.includes("is required")) {
          return `${formattedField} is required.`;
        }
        if (message.includes("must be one of")) {
          const possibleValues = message.match(/\[(.*?)\]/)?.[1];
          return `${formattedField} must be one of [${possibleValues}].`;
        }
        if (message.includes("is not allowed")) {
          return `${formattedField} is not allowed.`;
        }

        return `${message}`; // Fallback for other types of validation errors
      });

      // Combine all error messages into a single string
      const responseMessage =
        errorMessages.length > 1
          ? `${errorMessages.slice(0, -1).join(", ")} and ${errorMessages[errorMessages.length - 1]}`
          : errorMessages[0];

      // Send formatted error response
      useErrorResponse(res, responseMessage, 422);
      return;
    }

    next(); // Proceed to the next middleware if no errors
  };
};
