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

    // The filter already ensures we only get users/employees with deletedAt set and older than threshold.
    const oldUsers = await User.find({
      deletedAt: { $ne: null, $lte: threshold },
    });

    for (const user of oldUsers) {
      await Archive.save("User", user.toObject());
      await User.deleteOne({ _id: user._id });
    }

    const oldEmployees = await Employee.find({
      deletedAt: { $ne: null, $lte: threshold },
    });

    for (const emp of oldEmployees) {
      await Archive.save("Employee", emp.toObject());
      await Employee.deleteOne({ _id: emp._id });
    }
  },
};
