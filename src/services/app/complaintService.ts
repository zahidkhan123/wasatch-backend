import { ComplaintModel } from "../../models/complaint/complaint.model.js";
import { createComplaintSchema } from "../../validators/complaint/createComplaintValidator.js";

export const createComplaintService = async (
  {
    subject,
    description,
    media_url,
  }: { subject: string; description: string; media_url: string[] },
  userId: string
) => {
  try {
    const complaint = await ComplaintModel.create({
      subject,
      description,
      media_url,
      userId,
    });
    return {
      success: true,
      statusCode: 200,
      message: "Complaint created successfully",
      data: complaint,
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

export const getComplaintService = async (userId: string) => {
  try {
    const complaints = await ComplaintModel.find({ userId: userId })
      .select("-__v -updatedAt")
      .sort({
        createdAt: -1,
      });
    return {
      success: true,
      statusCode: 200,
      message: "Complaints fetched successfully",
      data: complaints,
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
