import {
  SettingsModel,
  ISettings,
} from "../../models/settings/settings.model.js";

export const getSettingsService = async () => {
  const settings = await SettingsModel.find();
  return settings;
};

export const createSettingService = async (data: ISettings) => {
  const setting = await SettingsModel.create(data);
  return setting;
};
