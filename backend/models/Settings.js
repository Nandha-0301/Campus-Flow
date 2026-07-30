import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: "default", unique: true, index: true },
    systemName: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    allowRegistration: { type: Boolean, default: true },
    defaultRole: {
      type: String,
      enum: ["admin", "staff", "student", "parent"],
      default: "student",
      index: true,
    },
    notifySmsEnabled: { type: Boolean, default: true },
    notifyEmailEnabled: { type: Boolean, default: true },
    notifyMarksEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);


