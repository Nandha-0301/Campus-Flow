import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
    day: {
      type: String,
      required: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

timetableSchema.index({ classId: 1, day: 1 });
timetableSchema.index({ staffId: 1, day: 1 });
timetableSchema.index({ classId: 1, day: 1, startTime: 1 });

export default mongoose.model("Timetable", timetableSchema);
