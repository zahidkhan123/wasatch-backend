import { model, Schema } from "mongoose";
import { Employee } from "../employee/employee.model.js";
import { User } from "../user.model.js";

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
    const threshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    // Only select users who have been soft-deleted (deletedAt exists and is older than threshold)
    const oldUsers = await User.find({
      deletedAt: { $exists: true, $lte: threshold },
    });
    for (const user of oldUsers) {
      await User.findByIdAndDelete(user._id);
      await ArchiveModel.deleteMany({ "data._id": user._id });
    }

    // Only select employees who have been soft-deleted (deletedAt exists and is older than threshold)
    const oldEmployees = await Employee.find({
      deletedAt: { $exists: true, $lte: threshold },
    });
    for (const emp of oldEmployees) {
      await Employee.findByIdAndDelete(emp._id);
      await ArchiveModel.deleteMany({ "data._id": emp._id });
    }
  },
};
