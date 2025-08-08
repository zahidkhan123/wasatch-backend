import { Request, Response } from "express";
import {
  createComplaintService,
  getComplaintService,
} from "../../services/app/complaintService.js";
import {
  useErrorResponse,
  useSuccessResponse,
} from "../../utils/apiResponse.js";

export const createComplaintController = async (
  req: Request,
  res: Response
) => {
  const { subject, description, media_url } = req.body;
  const user_id = req.user?._id;
  if (!user_id) {
    useErrorResponse(res, "User not found", 404);
    return;
  }
  const help = await createComplaintService(
    { subject, description, media_url },
    user_id
  );
  if (help.success) {
    useSuccessResponse(res, help.message, help.data, help.statusCode);
  } else {
    useErrorResponse(res, help.message, help.statusCode);
  }
};

export const getComplaintController = async (req: Request, res: Response) => {
  const user_id = req.user?._id;

  const help = await getComplaintService(user_id);
  if (help.success) {
    useSuccessResponse(res, help.message, help.data, help.statusCode);
  } else {
    useErrorResponse(res, help.message, help.statusCode);
  }
};
