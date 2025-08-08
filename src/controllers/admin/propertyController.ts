import { Request, Response } from "express";
import {
  createPropertyService,
  getPropertiesService,
  getPropertyByIdService,
  updatePropertyService,
} from "../../services/admin/propertryService.js";
import { catchAsync } from "../../utils/catch-async.js";
import {
  useSuccessResponse,
  useErrorResponse,
} from "../../utils/apiResponse.js";

export const createProperty = catchAsync(
  async (req: Request, res: Response) => {
    const adminId = req.user?._id; // comes from auth middleware
    const result = await createPropertyService(req.body, adminId as string);

    if (result.success) {
      useSuccessResponse(res, result.message, result.data, result.statusCode);
    } else {
      useErrorResponse(res, result.message, result.statusCode);
    }
  }
);

export const getProperties = catchAsync(async (req: Request, res: Response) => {
  const result = await getPropertiesService();
  if (result.success) {
    useSuccessResponse(res, result.message, result.data, result.statusCode);
  } else {
    useErrorResponse(res, result.message, result.statusCode);
  }
});

export const getPropertyById = catchAsync(
  async (req: Request, res: Response) => {
    const result = await getPropertyByIdService(req.params.id);
    if (result.success) {
      useSuccessResponse(res, result.message, result.data, result.statusCode);
    } else {
      useErrorResponse(res, result.message, result.statusCode);
    }
  }
);

export const updateProperty = catchAsync(
  async (req: Request, res: Response) => {
    const result = await updatePropertyService(req.params.id, req.body);
    if (result.success) {
      useSuccessResponse(res, result.message, result.data, result.statusCode);
    } else {
      useErrorResponse(res, result.message, result.statusCode);
    }
  }
);
