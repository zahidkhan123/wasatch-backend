import { Schema, model, Document, Types, Query } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  property: Types.ObjectId;
  buildingNumber: string;
  unitNumber: string;
  apartmentName: string;
  accessCode: string;
  notifications: {
    push: boolean;
    email: boolean;
  };
  role: "user";
  otp: string;
  routinePickup: {
    isEnabled: boolean;
    daysOfWeek: number[];
    defaultTime: string;
  };
  deletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  softDelete(): Promise<void>;
  skipDeleted(): Query<IUser[], IUser>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
    },
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    buildingNumber: { type: String, required: true },
    unitNumber: { type: String, required: true },
    accessCode: { type: String, required: true },
    apartmentName: { type: String, required: true },
    notifications: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
    },
    role: { type: String, enum: ["user"], default: "user" },
    otp: { type: String, default: null },
    routinePickup: {
      isEnabled: { type: Boolean, default: true },
      daysOfWeek: { type: [Number], default: [1, 3, 5] },
      defaultTime: { type: String, default: "10:00" },
    },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.softDelete = async function (): Promise<void> {
  this.deletedAt = new Date();
  await this.save();
};

UserSchema.pre(/^find/, function (this: Query<any, any>, next: any) {
  if (this.getFilter().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

UserSchema.statics.skipDeleted = function () {
  return this.find().where("deletedAt").ne(null);
};
export const User = model<IUser>("User", UserSchema);
