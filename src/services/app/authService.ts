import { User } from "../../models/user.model.js";
import { generateToken } from "../../utils/jwt.js";
import { IUser, LoginCredentials } from "../../types/user.types.js";
import { generateOTP } from "../../helpers/helperFunctions.js";
import { UserType } from "../../types/enums.js";
import { isMongoErrorWithKeyValue } from "../../utils/mongoErrorHandler.js";
import { runInTransaction } from "../../utils/transactionHelper.js";
import { sendNotification } from "../../utils/notification.js";
import { sendEmailJob } from "./emailService.js";
import { responseMessages } from "../../utils/responseMessages.js";
import { Employee, IEmployee } from "../../models/employee/employee.model.js";
import { Admin, IAdmin } from "../../models/admin/admin.model.js";
import { Property } from "../../models/admin/property.model.js";
import { EmployeePropertyAssignment } from "../../models/admin/EmployeePropertyAssignment.js";
import { Archive } from "../../models/archive/archive.model.js";
export const registerUser = async (userData: IUser): Promise<any> => {
  return runInTransaction(async (session) => {
    const otp = generateOTP().toString();

    const property = await Property.findById(userData.property);
    if (!property) {
      return {
        message: "Property not found",
        statusCode: 404,
        success: false,
      };
    }

    if (userData.accessCode !== property.accessCode) {
      return {
        message: "Invalid access code",
        statusCode: 400,
        success: false,
      };
    }
    const [user] = await User.create(
      [
        {
          ...userData,
          property: property._id,
        },
      ],
      { session }
    );

    if (process.env.NODE_ENV === "development") {
      await sendEmailJob("otp", user.email, "Email Confirmation", {
        otp: "1122",
      });
      (user as unknown as IUser).otp = "1122";
      await user.save({ session });
    } else {
      await sendEmailJob("otp", user.email, "Email Confirmation", { otp });
      (user as unknown as IUser).otp = otp;
      await user.save({ session });
    }

    await sendNotification(
      (user as unknown as IUser)._id.toString() as string,
      "user",
      "Your account has been created successfully.",
      "admin_alert"
    );

    return {
      message: responseMessages.userRegistered,
      statusCode: 200,
      success: true,
      data: null,
    };
  }).catch((error) => {
    if (isMongoErrorWithKeyValue(error) && error.code === 11000) {
      const firstKey = Object.keys(error.keyValue)[0];
      const errorMessage = `${firstKey.charAt(0).toUpperCase() + firstKey.slice(1)} is already registered`;

      return { message: errorMessage, statusCode: 400, success: false };
    }
    return { message: error.message, statusCode: 400, success: false };
  });
};

export const registerEmployeeService = async (
  employeeData: IEmployee
): Promise<any> => {
  try {
    // 1. Verify the assigned property exists
    const property = await Property.findById(employeeData.assignedArea);
    if (!property) {
      return {
        message: "Property not found",
        statusCode: 404,
        success: false,
      };
    }

    // 2. Create the employee
    const employee = new Employee({
      ...employeeData,
      assignedArea: property._id,
      role: "employee",
    });
    await employee.save();

    // 3. Create primary assignment record
    await new EmployeePropertyAssignment({
      employeeId: employee._id,
      propertyId: property._id,
      isPrimary: true,
      validFrom: new Date(), // starts today
      validUntil: null, // permanent
    }).save();

    return {
      message: "Employee registered and assigned to property successfully",
      statusCode: 201,
      success: true,
      data: employee,
    };
  } catch (error: any) {
    console.error("Register Employee Error:", error);

    if (isMongoErrorWithKeyValue(error) && error.code === 11000) {
      const firstKey = Object.keys(error.keyValue)[0];
      const errorMessage = `${firstKey.charAt(0).toUpperCase() + firstKey.slice(1)} is already registered`;

      return { message: errorMessage, statusCode: 400, success: false };
    }

    return { message: error.message, statusCode: 400, success: false };
  }
};

export const registerAdminService = async (adminData: IAdmin): Promise<any> => {
  try {
    const admin = new Admin({ ...adminData, role: "admin" });
    await admin.save();

    return {
      message: "Admin registered successfully",
      statusCode: 201,
      success: true,
      data: null,
    };
  } catch (error: any) {
    if (isMongoErrorWithKeyValue(error) && error.code === 11000) {
      const firstKey = Object.keys(error.keyValue)[0];
      const errorMessage = `${firstKey.charAt(0).toUpperCase() + firstKey.slice(1)} is already registered`;

      return { message: errorMessage, statusCode: 400, success: false };
    }
    return { message: error.message, statusCode: 400, success: false };
  }
};

export const loginUser = async ({
  email,
  password,
  role,
}: LoginCredentials) => {
  // Validate role and select model, fields, and population options
  let model: any;
  let selectFields = "";
  let populateOptions: any = undefined;

  if (role === "user") {
    model = User;
    selectFields =
      "name email profile unitNumber property role password phoneNumber apartmentName buildingNumber";
    populateOptions = {
      path: "property",
      model: "Property",
      select: "name address",
    };
  } else if (role === "employee") {
    model = Employee;
    selectFields =
      "firstName lastName email phoneNumber employeeId assignedArea role active password";
    populateOptions = {
      path: "assignedArea",
      model: "Property",
      select: "name address",
    };
  } else if (role === "admin") {
    model = Admin;
    selectFields = "name email role password";
    // No population for admin
  } else {
    return {
      message: "Invalid role specified.",
      statusCode: 400,
      success: false,
    };
  }

  // Find user by email
  const userDoc = await model
    .findOne({ email: email.toLowerCase() })
    .select(selectFields)
    .populate(populateOptions ? populateOptions : undefined);

  if (!userDoc) {
    return {
      message: responseMessages.userNotFound,
      statusCode: 404,
      success: false,
    };
  }

  // Check password
  const isMatch = await userDoc.comparePassword(password);
  if (!isMatch) {
    return {
      message: responseMessages.invalidCredentials,
      statusCode: 400,
      success: false,
    };
  }

  // Generate token (role must match model's allowed values)
  const tokenPayload: any = { _id: userDoc._id };
  if (role === "user" || role === "admin" || role === "employee") {
    tokenPayload.role = role;
  }

  const token = generateToken(tokenPayload);

  // Remove password from user object
  const { password: _, ...userWithoutPassword } = userDoc.toObject();

  return {
    message: responseMessages.loginSuccessful,
    statusCode: 200,
    success: true,
    data: {
      token,
      user: userWithoutPassword,
    },
  };
};

export const sendPasswordResetEmail = async (
  email: string,
  user_type: UserType
) => {
  const user = await User.findOne({ email, user_type });
  if (!user) {
    return {
      message: responseMessages.userNotFound,
      statusCode: 404,
      success: false,
    };
  }

  const otp =
    process.env.NODE_ENV === "development" ? "1122" : generateOTP().toString();

  await sendEmailJob("otp", email, "Password Reset Request", {
    otp: otp,
  });
  (user as unknown as IUser).otp = otp;
  await user.save();

  return {
    message: responseMessages.otpSent,
    statusCode: 200,
    success: true,
  };
};

export const resendOTP = async (email: string, user_type: UserType) => {
  const user = await User.findOne({ email, user_type });
  if (!user) {
    return {
      message: responseMessages.userNotFound,
      statusCode: 404,
      success: false,
    };
  }

  (user as unknown as IUser).otp = null as unknown as string;
  await user.save();

  const otp =
    process.env.NODE_ENV === "development" ? "1122" : generateOTP().toString();

  await sendEmailJob("otp", email, "Verify Email", {
    otp: otp,
  });

  (user as unknown as IUser).otp = otp;
  await user.save();

  return {
    message: responseMessages.otpSent,
    statusCode: 200,
    success: true,
  };
};

export const verifyUserOtp = async (
  email: string,
  user_type: UserType,
  otp: string,
  verify_email?: boolean
) => {
  try {
    const user = await User.findOne({ email, user_type });
    if (!user) {
      return {
        message: responseMessages.userNotFound,
        statusCode: 404,
        success: false,
      };
    }

    // Check if OTP matches and is present
    if (!user.otp || user.otp !== otp) {
      return {
        message: responseMessages.invalidOtp,
        statusCode: 400,
        success: false,
      };
    }

    // Clear OTP after successful verification
    (user as unknown as IUser).otp = null as unknown as string;
    await user.save();

    const token = generateToken(user as unknown as IUser);

    return {
      message: responseMessages.emailVerified,
      data: { token },
      statusCode: 200,
      success: true,
    };
  } catch (error) {
    console.log("error", error);
    return {
      message: error instanceof Error ? error.message : "Internal server error",
      statusCode: 500,
      success: false,
    };
  }
};

export const resetUserPassword = async (
  email: string,
  newPassword: string,
  user_type: UserType
) => {
  const user = await User.findOne({ email, user_type });
  if (!user) {
    return {
      message: responseMessages.userNotFound,
      statusCode: 404,
      success: false,
    };
  }

  user.password = newPassword;
  await user.save();

  await sendNotification(
    (user as unknown as IUser)._id.toString() as string,
    "user",
    "Your password has been reset successfully",
    "admin_alert"
  );

  return {
    message: "Password has been reset successfully.",
    statusCode: 200,
    success: true,
  };
};

export const verifyEmail = async (user_id: string, email: string) => {
  const user = await User.findById(user_id);
  if (!user) {
    return {
      message: responseMessages.userNotFound,
      statusCode: 404,
      success: false,
    };
  }

  const existingUser = await User.findOne({ email });
  if (existingUser && !user.email) {
    return {
      message: responseMessages.emailAlreadyRegistered,
      statusCode: 400,
      success: false,
    };
  }

  const otp =
    process.env.NODE_ENV === "development" ? "1122" : generateOTP().toString();

  await sendEmailJob("otp", email, "Verify Email", {
    otp: otp,
  });

  (user as unknown as IUser).otp = otp;
  await user.save();

  return {
    message: "Please verify your email.",
    statusCode: 200,
    success: true,
    data: null,
  };
};

export const deleteAccountService = async (
  userId: string,
  user_type: UserType
) => {
  try {
    const user = await User.findById(userId);
    const employee = await Employee.findById(userId);
    const admin = await Admin.findById(userId);

    if (!user && !employee && !admin) {
      return {
        success: false,
        message: "User not found or not authorized to delete account",
        statusCode: 404,
      };
    }

    if (
      user_type === "user" &&
      (user as { _id: string })._id.toString() === userId
    ) {
      await Archive.save("User", user as unknown as IUser);
      await user?.softDelete();
    } else if (
      user_type === "employee" &&
      (employee as { _id: string })._id.toString() === userId
    ) {
      await Archive.save("Employee", employee as unknown as IEmployee);
      await employee?.softDelete();
    } else {
      return {
        success: false,
        message: "User not found or not authorized to delete account",
        statusCode: 404,
      };
    }

    return {
      success: true,
      message: "Account deleted successfully",
      statusCode: 200,
      data: null,
    };
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      message: "Failed to delete account.",
      error: error.message,
      statusCode: 500,
    };
  }
};
