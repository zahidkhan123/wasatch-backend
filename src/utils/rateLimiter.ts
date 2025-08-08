import rateLimit from "express-rate-limit";
import { useErrorResponse } from "./apiResponse.js";
import { Request, Response } from "express";

export const useResponse = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: "Too many requests, please try again later.",
    handler: (req: Request, res: Response) => {
      // const remainingTime = Math.ceil(
      //   (req.rateLimit.resetTime - Date.now()) / 1000
      // );

      return useErrorResponse(res, "Too many requests. Try again later.", 429);
    },
  });
};
