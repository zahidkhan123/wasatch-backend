import { User } from "../models/user.model.js";
import { Employee } from "../models/employee/employee.model.js";
import { ArchiveModel } from "../models/archive/archive.model.js";

export const Archive = {
  save: async (type: "User" | "Employee", data: any) => {
    await ArchiveModel.create({ type, data, deletedAt: new Date() });
  },

  cleanupOld: async () => {
    const threshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Permanently delete users
    const oldUsers = await User.find({ deletedAt: { $lte: threshold } });
    for (const user of oldUsers) {
      await User.findByIdAndDelete(user._id);
      await ArchiveModel.deleteMany({ "data._id": user._id });
    }

    // Permanently delete employees
    const oldEmployees = await Employee.find({
      deletedAt: { $lte: threshold },
    });
    for (const emp of oldEmployees) {
      await Employee.findByIdAndDelete(emp._id);
      await ArchiveModel.deleteMany({ "data._id": emp._id });
    }
  },
};
