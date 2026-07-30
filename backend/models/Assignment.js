import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["WRITING", "SEMINAR", "PROJECT", "PRESENTATION"],
      index: true,
    },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    maxMarks: { type: Number, required: true, min: 0 },
    deadline: { type: Date, default: null, index: true },
    description: { type: String, trim: true, default: "" },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  },
  { timestamps: true }
);

assignmentSchema.index({ classId: 1, subjectId: 1, deadline: 1 });
assignmentSchema.index({ staffId: 1, deadline: 1 });
assignmentSchema.index({ classId: 1, deadline: 1 });
assignmentSchema.index({ subjectId: 1, deadline: 1 });

export default mongoose.model("Assignment", assignmentSchema);

