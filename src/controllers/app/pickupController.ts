import { Request, Response } from "express";
import {
  createOnDemandPickup,
  getPickupRequests,
} from "../../services/app/pickupService.js";
import {
  useErrorResponse,
  useSuccessResponse,
} from "../../utils/apiResponse.js";

export const pickupRequestController = async (req: Request, res: Response) => {
  const { scheduledDate, timeSlot, specialInstructions } = req.body;
  const userId = req.user?._id;
  const response = await createOnDemandPickup(
    { scheduledDate, timeSlot, specialInstructions },
    userId
  );
  if (response.success) {
    useSuccessResponse(
      res,
      response.message,
      response.data,
      response.statusCode || 201
    );
  } else {
    useErrorResponse(res, response.message, response.statusCode || 400);
  }
};

export const getPickupRequestsController = async (
  req: Request,
  res: Response
) => {
  const userId = req.user?._id.toString();
  console.log("userId", userId);
  const response = await getPickupRequests({
    userId,
    status: req.query.status as any,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    date: req.query.date as string,
  });
  if (response.success) {
    useSuccessResponse(
      res,
      response.message,
      response.data,
      response.statusCode || 200
    );
  } else {
    useErrorResponse(res, response.message, response.statusCode || 400);
  }
};
