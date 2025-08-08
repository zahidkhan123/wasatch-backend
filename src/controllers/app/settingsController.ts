import { Request, Response } from "express";
import {
  getSettingsService,
  createSettingService,
} from "../../services/app/settingService.js";
import { useSuccessResponse } from "../../utils/apiResponse.js";
export const getSettingsController = async (req: Request, res: Response) => {
  const settings = await getSettingsService();
  useSuccessResponse(res, "Settings fetched successfully", settings, 200);
};

export const createSettingController = async (req: Request, res: Response) => {
  // const { maintenance_mode, show_lawyer_listing } = req.body;
  const setting = await createSettingService(req.body);
  useSuccessResponse(res, "Setting created successfully", setting, 201);
};
