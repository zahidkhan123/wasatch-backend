import { Schema, model, Document } from "mongoose";

interface IProperty extends Document {
  name: string;
  units: number;
  managerName: string;
  emailAddress: string;
  phone: string;
  accessCode: string;
  location: {
    lat: number;
    lng: number;
  };
  radius?: number;
  isPaid?: boolean;
  isActive?: boolean;
}

const propertySchema = new Schema<IProperty>(
  {
    name: { type: String, required: true },
    units: Number,
    managerName: String,
    emailAddress: String,
    phone: String,
    accessCode: String,
    location: {
      lat: Number,
      lng: Number,
    },
    radius: { type: Number, default: 100 },
    isPaid: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

propertySchema.index({ location: "2dsphere" });

const Property = model<IProperty>("Property", propertySchema);
export { Property, IProperty };
