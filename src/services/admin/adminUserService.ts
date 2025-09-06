import mongoose from "mongoose";
import { User } from "../../models/user.model.js";
import { responseMessages } from "../../utils/responseMessages.js";
import { UserType } from "../../types/enums.js";
import { IUser, LoginCredentials } from "../../types/user.types.js";
import { runInTransaction } from "../../utils/transactionHelper.js";
import { generateToken } from "../../utils/jwt.js";
import { isMongoErrorWithKeyValue } from "../../utils/mongoErrorHandler.js";
import { Admin, IAdmin } from "../../models/admin/admin.model.js";
import dayjs from "dayjs";
import { PickupRequest } from "../../models/admin/PickupRequest.model.js";
import { Employee } from "../../models/employee/employee.model.js";
import { Property } from "../../models/admin/property.model.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { Task } from "../../models/admin/task.model.js";
dayjs.extend(utc);
dayjs.extend(timezone);

export const loginUser = async ({
  email,
  password,
  role,
}: LoginCredentials) => {
  const user = await Admin.findOne({
    email: email.toLowerCase(),
    role: role,
  });

  if (!user) {
    return {
      message: responseMessages.userNotFound,
      statusCode: 404,
      success: false,
    };
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return {
      message: responseMessages.invalidCredentials,
      statusCode: 400,
      success: false,
    };
  }

  const token = generateToken(user as unknown as IUser);
  const { password: _, ...userData } = user.toObject();

  const response = {
    user: userData,
    token,
  };

  return {
    message: responseMessages.loginSuccessful,
    statusCode: 200,
    success: true,
    data: response,
  };
};

interface GetUsersServiceParams {
  page?: number;
  limit?: number;
}

const getAllUsersService = async ({ search = "" }: { search?: string }) => {
  try {
    const filter: any = {};

    if (search && search.trim() !== "") {
      filter.name = { $regex: search.trim(), $options: "i" };
    }
    console.log(filter);
    // Populate the property assigned to the user
    const users = await User.find(filter)
      .select("-__v -password -updatedAt -createdAt -role -active")
      .populate({
        path: "property",
        select: "name unitNumber buildingName apartmentName address", // Only get the property name
      })
      .select("-password")
      .lean();
    console.log(users);
    const formattedUsers = users.map((user) => {
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        property: user.property,
        unitNumber: user.unitNumber || "",
        avatarUrl: user.avatarUrl || "",
      };
    });

    return {
      success: true,
      message: "Users fetched successfully",
      statusCode: 200,
      data: {
        users: formattedUsers,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Error fetching users",
      statusCode: 500,
      data: null,
    };
  }
};

const createUserService = async (userData: IUser): Promise<any> => {
  return runInTransaction(async (session) => {
    const [user] = await Admin.create(
      [
        {
          ...userData,
        },
      ],
      { session }
    );

    const token = generateToken(user as unknown as IUser);

    const { name, email } = user;

    return {
      message: responseMessages.userRegistered,
      statusCode: 200,
      success: true,
      data: null,
    };
  }).catch((error) => {
    console.log(error);
    console.log("error", error);
    if (isMongoErrorWithKeyValue(error) && error.code === 11000) {
      const firstKey = Object.keys(error.keyValue)[0];
      console.log(firstKey);
      const errorMessage =
        firstKey === "email"
          ? `${firstKey}: Email is already registered`
          : `${firstKey} is already registered`;

      return {
        message: errorMessage,
        statusCode: 400,
        success: false,
      };
    }

    return {
      message: error.message,
      statusCode: 400,
      success: false,
    };
  });
};

export const getAdminDashboardService = async () => {
  try {
    // Use application timezone from configuration
    const appTz = process.env.APP_TZ || "America/Denver";
    const todayStart = dayjs().tz(appTz).startOf("day").toDate();
    const todayEnd = dayjs().tz(appTz).endOf("day").toDate();

    // === 1. PICKUP REQUEST STATS ===
    const allTodayPickups = await PickupRequest.find({
      date: { $gte: todayStart.toISOString(), $lte: todayEnd.toISOString() },
    });

    const totalRequests = allTodayPickups.length;
    const completedRequests = allTodayPickups.filter(
      (p) => p.status === "completed"
    ).length;
    const pendingRequests = allTodayPickups.filter(
      (p) => p.status === "scheduled"
    ).length;
    const routinePickups = allTodayPickups.filter(
      (p) => p.type === "routine"
    ).length;
    const onDemandPickups = allTodayPickups.filter(
      (p) => p.type === "on_demand"
    ).length;

    // === 2. EMPLOYEE STATS ===
    const [onDuty, offDuty, late] = await Promise.all([
      Employee.countDocuments({ status: "on_duty" }),
      Employee.countDocuments({ status: "off_duty" }),
      Employee.countDocuments({ status: "late" }),
    ]);
    console.log("pendingRequests", pendingRequests);
    // === 3. PROPERTY STATS ===
    const totalProperties = await Property.countDocuments();

    // You could also mark properties active by checking for any pickup/task on that property today.
    const activeProperties = await Property.find({ isActive: true });
    const activePropertiesCount = activeProperties.length;

    return {
      success: true,
      message: "Admin dashboard fetched successfully",
      statusCode: 200,
      data: {
        requests: {
          total: totalRequests,
          completed: completedRequests,
          pending: pendingRequests,
          routine: routinePickups,
          onDemand: onDemandPickups,
        },
        employees: {
          onDuty,
          offDuty,
          late,
        },
        properties: {
          total: totalProperties,
          active: activePropertiesCount,
        },
        tasks: {
          total: totalRequests,
          completed: completedRequests,
        },
      },
    };
  } catch (err) {
    console.error("Admin dashboard error:", err);
    return {
      success: false,
      message: "Failed to load admin dashboard",
      statusCode: 500,
      data: null,
    };
  }
};

export { getAllUsersService, createUserService };
