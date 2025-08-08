import { Schema, model, Document } from "mongoose";

interface IEmployeePropertyAssignment extends Document {
  employeeId: Schema.Types.ObjectId;
  propertyId: Schema.Types.ObjectId;
  isPrimary: boolean;
  validFrom: Date;
  validUntil?: Date; // null or undefined = permanent
}

const assignmentSchema = new Schema<IEmployeePropertyAssignment>(
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
    isPrimary: { type: Boolean, default: false },
    validFrom: { type: Date, required: true },
    validUntil: Date,
  },
  { timestamps: true }
);

const EmployeePropertyAssignment = model<IEmployeePropertyAssignment>(
  "EmployeePropertyAssignment",
  assignmentSchema
);
export { EmployeePropertyAssignment, IEmployeePropertyAssignment };
