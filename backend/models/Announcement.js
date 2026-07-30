import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["HOLIDAY", "EXAM", "INTERNAL", "EVENT", "GENERAL"],
    },
    target: {
      type: String,
      required: true,
      enum: ["STUDENTS", "PARENTS"],
    },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

announcementSchema.index({ isActive: 1, target: 1, classId: 1 });
announcementSchema.index({ target: 1, classId: 1 });
announcementSchema.index({ type: 1 });

export default mongoose.model("Announcement", announcementSchema);

