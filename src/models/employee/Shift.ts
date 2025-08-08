import { Schema, model, Document } from "mongoose";

interface IShift extends Document {
  employeeId: Schema.Types.ObjectId;
  propertyId: Schema.Types.ObjectId;
  date: Date;
  shiftStart: Date;
  shiftEnd: Date;
  isCustom: boolean;
}

const shiftSchema = new Schema<IShift>(
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
    date: { type: Date, required: true },
    shiftStart: { type: Date, required: true },
    shiftEnd: { type: Date, required: true },
    isCustom: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Shift = model<IShift>("Shift", shiftSchema);
export { Shift, IShift };
