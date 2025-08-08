import { Response } from "express";

const useSuccessResponse = <T>(
  res: Response,
  message: string,
  data: T,
  statusCode: number
): Response<T> => {
  return res.status(statusCode).json({
    message,
    success: true,
    statusCode,
    data,
  });
};

const useErrorResponse = (
  res: Response,
  message: string,
  statusCode: number
): Response => {
  return res.status(statusCode).json({
    message,
    success: false,
    statusCode,
  });
};

export { useSuccessResponse, useErrorResponse };
