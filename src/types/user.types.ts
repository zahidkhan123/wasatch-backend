import mongoose from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    avatarUrl?: string;
  };
  property: mongoose.Types.ObjectId;
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
