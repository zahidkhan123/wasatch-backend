import { Request, Response } from "express";
import { saveFcmTokenService } from "../../services/app/fcmService.js";
import {
  useErrorResponse,
  useSuccessResponse,
} from "../../utils/apiResponse.js";

export const saveFcmTokenController = async (req: Request, res: Response) => {
  const user_id = req.user?._id;
  const userType = req.user?.role;
  const { fcm_token, platform } = req.body;

  console.log(user_id, fcm_token, platform);
  const help = await saveFcmTokenService(
    { fcm_token, platform },
    user_id,
    userType
  );
  if (help.success) {
    useSuccessResponse(res, help.message, help.data, help.statusCode);
  } else {
    useErrorResponse(res, help.message, help.statusCode);
  }
};
