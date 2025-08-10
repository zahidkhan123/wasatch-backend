import { User } from "../../models/user.model.js";
import { Employee } from "../../models/employee/employee.model.js";

export const saveFcmTokenService = async (
  { fcm_token, platform }: { fcm_token: string; platform: string },
  userId: string,
  userType: string
) => {
  try {
    const Model = userType === "user" ? (User as any) : (Employee as any);

    // Ensure platform is always set
    const platformValue = platform || "unknown";

    // Use $addToSet to avoid duplicates in both arrays
    const updatedUser = await Model.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          fcmTokens: fcm_token,
          platforms: platformValue,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return {
        success: false,
        statusCode: 404,
        message: "User not found",
        data: null,
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "FCM token saved successfully",
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      message: (error as Error).message,
      data: null,
    };
  }
};
