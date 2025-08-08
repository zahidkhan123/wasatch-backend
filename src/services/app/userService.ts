import { User } from "../../models/user.model.js";
import { UserType } from "../../types/enums.js";
import bcrypt from "bcrypt";
import { isMongoErrorWithKeyValue } from "../../utils/mongoErrorHandler.js";
import { responseMessages } from "../../utils/responseMessages.js";
import { Employee } from "../../models/employee/employee.model.js";
import { Archive } from "../../models/archive/archive.model.js";

interface updateUserRequest {
  profile?: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    avatarUrl: string;
  };
  property?: string;
  buildingNumber?: string;
  unitNumber?: string;
}

export const updateUserService = async (
  userId: string,
  data: updateUserRequest
) => {
  try {
    const user = await User.findByIdAndUpdate(userId, data, {
      new: true,
    }).select("-password -createdAt -updatedAt -routinePickup -notifications");
    if (!user) {
      return {
        success: false,
        message: responseMessages.userNotFound,
        statusCode: 404,
        data: null,
      };
    }
    return {
      success: true,
      message: responseMessages.profileUpdated,
      statusCode: 200,
      data: user,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Error updating user"
    );
  }
};

export const deleteUserService = async (
  userId: string,
  user_type: UserType,
  email: string
) => {
  try {
    if (user_type === "user") {
      const user = await User.findOne({ _id: userId, email });
      if (!user) {
        return {
          success: false,
          message: responseMessages.userNotFound,
          statusCode: 404,
          data: null,
        };
      }

      // Save to archive
      await Archive.save("User", user);

      // Mark user as deleted and remove access
      user.deletedAt = new Date();
      user.password = "deleted"; // prevent login
      user.otp = "deleted";
      user.email = `${user.email}-deleted-${Date.now()}`; // avoid conflicts
      await user.save();

      // Optional: clean up sessions or tokens here

      return {
        success: true,
        message:
          "User account marked for deletion. Data will be permanently deleted after 3 months.",
        statusCode: 200,
        data: null,
      };
    } else if (user_type === "employee") {
      const employee = await Employee.findById(userId);
      if (!employee) {
        return {
          success: false,
          message: responseMessages.userNotFound,
          statusCode: 404,
          data: null,
        };
      }

      // Save to archive
      await Archive.save("Employee", employee);

      // Remove assignments, prevent access
      // await Task.updateMany(
      //   { assignedEmployees: employee._id },
      //   { $pull: { assignedEmployees: employee._id } }
      // );
      // await Attendance.deleteMany({ employeeId: employee._id });

      employee.deletedAt = new Date();
      employee.password = "deleted";
      employee.email = `${employee.email}-deleted-${Date.now()}`;
      await employee.save();

      // Optional: clean up sessions or tokens here

      console.log(
        `Admin Notification: Employee ${employee.email} scheduled for deletion.`
      );

      return {
        success: true,
        message:
          "Employee account marked for deletion. Data will be permanently deleted after 3 months.",
        statusCode: 200,
        data: null,
      };
    } else {
      return {
        success: false,
        message: "Invalid user type",
        statusCode: 400,
        data: null,
      };
    }
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Error deleting user"
    );
  }
};
