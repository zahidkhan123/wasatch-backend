import mongoose from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    avatarUrl?: string;
  };
  property: mongoose.Types.ObjectId;
  buildingNumber: string;
  unitNumber: string;
  notifications: {
    push: boolean;
    email: boolean;
  };
  accessCode: string;
  role: "user";
  otp: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: string;
}
