import { Schema, model, Document } from "mongoose";

interface IAttendance extends Document {
  employeeId: Schema.Types.ObjectId;
  shiftDate: Date; // Acts as the date identifier (YYYY-MM-DD)
  shiftStartTime: Date; // Planned start time
  shiftEndTime?: Date; // Planned end time
  status: "on_time" | "late" | "absent";
  totalHours?: number;

  // Track all property visits in a day
  propertyVisits: {
    propertyId: Schema.Types.ObjectId;
    checkIn: {
      time: Date;
      location?: {
        lat: number;
        lng: number;
      };
    };
    checkOut?: {
      time: Date;
      location?: {
        lat: number;
        lng: number;
      };
    };
    hoursWorked?: number;
  }[];

  // First check-in and last checkout of the day
  clockIn?: Date; // Becomes first check-in of the day
  clockOut?: Date; // Becomes last check-out of the day
}

const attendanceSchema = new Schema<IAttendance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    shiftDate: {
      type: Date,
      required: true,
      index: true,
    },
    shiftStartTime: { type: Date, required: true },
    shiftEndTime: Date,
    status: {
      type: String,
      enum: ["on_time", "late", "absent"],
      default: "absent",
    },
    totalHours: Number,
    propertyVisits: [
      {
        propertyId: {
          type: Schema.Types.ObjectId,
          ref: "Property",
          required: true,
        },
        checkIn: {
          time: { type: Date, required: true },
          location: {
            lat: Number,
            lng: Number,
          },
        },
        checkOut: {
          time: Date,
          location: {
            lat: Number,
            lng: Number,
          },
        },
        hoursWorked: Number,
      },
    ],
    clockIn: Date, // First check-in of the day
    clockOut: Date, // Last check-out of the day
  },
  {
    timestamps: true,
  }
);

// Ensure one attendance record per employee per day
attendanceSchema.index({ employeeId: 1, shiftDate: 1 }, { unique: true });

const Attendance = model<IAttendance>("Attendance", attendanceSchema);
export { Attendance, IAttendance };
