import { Schema, model, Document } from "mongoose";

interface ITemporaryAssignment extends Document {
  employeeId: Schema.Types.ObjectId;
  propertyId: Schema.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  assignedBy: Schema.Types.ObjectId; // Admin who made the assignment
  reason: string; // e.g., "Covering for absent employee"
}

const temporaryAssignmentSchema = new Schema<ITemporaryAssignment>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    reason: { type: String, required: true },
  },
  { timestamps: true }
);

const TemporaryAssignment = model<ITemporaryAssignment>(
  "TemporaryAssignment",
  temporaryAssignmentSchema
);

export { TemporaryAssignment, ITemporaryAssignment };
