import { Schema, model, Document } from "mongoose";

interface IPickupRequest extends Document {
  userId: Schema.Types.ObjectId;
  propertyId: Schema.Types.ObjectId;
  unitNumber: string;
  buildingNumber: string;
  apartmentName: string;
  type: "routine" | "on_demand";
  date: Date;
  timeSlot: string;
  specialInstructions?: string;
  status: "scheduled" | "completed" | "missed" | "delayed";
  assignedTaskId?: Schema.Types.ObjectId;
}

const pickupRequestSchema = new Schema<IPickupRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    unitNumber: String,
    buildingNumber: String,
    apartmentName: String,
    type: { type: String, enum: ["routine", "on_demand"], required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    specialInstructions: String,
    status: {
      type: String,
      enum: ["scheduled", "completed", "missed", "delayed"],
      default: "scheduled",
    },
    assignedTaskId: { type: Schema.Types.ObjectId, ref: "Task" },
  },
  { timestamps: true }
);

const PickupRequest = model<IPickupRequest>(
  "PickupRequest",
  pickupRequestSchema
);
export { PickupRequest, IPickupRequest };
