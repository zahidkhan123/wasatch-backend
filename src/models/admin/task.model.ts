import { Schema, model, Document } from "mongoose";

interface ITask extends Document {
  requestId: Schema.Types.ObjectId;
  employeeId?: Schema.Types.ObjectId;
  propertyId: Schema.Types.ObjectId;
  unitNumber: string;
  buildingName: string;
  apartmentName: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  specialInstructions?: string;
  status: "pending" | "in_progress" | "delayed" | "missed" | "completed";
  delayReason?: string;
  issueReported?: string;
  assignedEmployees: Schema.Types.ObjectId[];
}

const taskSchema = new Schema<ITask>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "PickupRequest",
      required: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    unitNumber: String,
    buildingName: String,
    apartmentName: String,
    scheduledStart: Date,
    scheduledEnd: Date,
    actualStart: Date,
    actualEnd: Date,
    specialInstructions: String,
    status: {
      type: String,
      enum: ["pending", "in_progress", "delayed", "missed", "completed"],
      default: "pending",
    },
    delayReason: String,
    issueReported: {
      type: Schema.Types.ObjectId,
      ref: "Issue",
      default: null,
    },
    assignedEmployees: [{ type: Schema.Types.ObjectId, ref: "Employee" }],
  },
  { timestamps: true }
);

const Task = model<ITask>("Task", taskSchema);
export { Task, ITask };
