import { Request, Response, NextFunction } from "express";
import { useErrorResponse } from "./apiResponse.js";

export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      return useErrorResponse(res, error.message, 500);
    });
  };
};
