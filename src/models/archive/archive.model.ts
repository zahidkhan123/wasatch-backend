import { model, Schema } from "mongoose";

const ArchiveSchema = new Schema(
  {
    type: { type: String, enum: ["User", "Employee"], required: true },
    data: { type: Schema.Types.Mixed, required: true },
    deletedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ArchiveModel = model("ArchivedData", ArchiveSchema);

export const Archive = {
  save: async (type: "User" | "Employee", data: any) => {
    await ArchiveModel.create({ type, data });
  },

  cleanupOld: async () => {
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await ArchiveModel.deleteMany({ deletedAt: { $lt: threeMonthsAgo } });
  },
};
