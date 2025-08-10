import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { Feedback } from "../../models/Feedback/feedback.model.js";
dayjs.extend(utc);
dayjs.extend(timezone);

const getFeedbackService = async () => {
  try {
    const feedback = await Feedback.find().populate(
      "userId",
      "profile.firstName profile.lastName email"
    );

    // const formattedFeedback = feedback.map((feedback) => {
    //   return {
    //     _id: feedback._id,
    //     rating: feedback.rating,
    //     pickupTimes: feedback.pickupTimes,
    //     supportSystem: feedback.supportSystem,
    //     staffPerformance: feedback.staffPerformance,
    //     comment: feedback.comment,
    //     createdAt: feedback.createdAt,
    //     profile: (feedback.userId as any)?.profile,
    //   };
    // });

    return {
      success: true,
      message: "Feedback fetched successfully",
      statusCode: 200,
      data: {
        feedback: feedback,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Error fetching feedback",
      statusCode: 500,
      data: null,
    };
  }
};

export { getFeedbackService };
