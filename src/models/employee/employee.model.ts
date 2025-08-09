import { Schema, model, Document, Query } from "mongoose";
import bcrypt from "bcrypt";

interface IEmployee extends Document {
  firstName: string;
  lastName: string;
  phone: string;
  employeeId: string;
  email: string;
  password: string;
  assignedArea: Schema.Types.ObjectId;
  status: "on_duty" | "off_duty" | "late";
  role: "employee";
  currentAttendance?: Schema.Types.ObjectId;
  shiftStart: string;
  shiftEnd: string;
  lastCheckIn: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  deletedAt: Date;
  softDelete(): Promise<void>;
}

const employeeSchema = new Schema<IEmployee>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    employeeId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    assignedArea: { type: Schema.Types.ObjectId, ref: "Property" },
    status: {
      type: String,
      enum: ["on_duty", "off_duty", "late"],
      default: "off_duty",
    },
    currentAttendance: {
      type: Schema.Types.ObjectId,
      ref: "Attendance",
    },
    lastCheckIn: { type: Date },
    role: { type: String, enum: ["employee"], default: "employee" },
    shiftStart: { type: String, required: true },
    shiftEnd: { type: String, required: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

employeeSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

employeeSchema.methods.softDelete = async function (): Promise<void> {
  this.deletedAt = new Date();
  await this.save();
};

employeeSchema.pre<Query<IEmployee[], IEmployee>>(
  /^find/,
  function (next: any) {
    this.setQuery({ ...this.getQuery(), deletedAt: null });
    next();
  }
);

const Employee = model<IEmployee>("Employee", employeeSchema);
export { Employee, IEmployee };
