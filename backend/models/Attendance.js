import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["present", "absent"], required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, subjectId: 1, classId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ staffId: 1, date: 1 });
attendanceSchema.index({ classId: 1, date: 1 });
attendanceSchema.index({ subjectId: 1, date: 1 });

export default mongoose.model("Attendance", attendanceSchema);