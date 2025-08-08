import mongoose, { Schema, Document } from "mongoose";

interface ISettings extends Document {
  maintenance_mode: boolean;
  show_lawyer_listing: boolean;
}

const settingsSchema: Schema = new Schema(
  {
    maintenance_mode: { type: Boolean, default: false },
    show_lawyer_listing: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SettingsModel = mongoose.model<ISettings>("Settings", settingsSchema);

export { SettingsModel, ISettings };
