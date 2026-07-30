import mongoose from "mongoose";

const teachingAssignmentSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
  },
  { timestamps: true }
);

teachingAssignmentSchema.index({ classId: 1, subjectId: 1 }, { unique: true });
teachingAssignmentSchema.index({ staffId: 1, classId: 1 });

export default mongoose.model("TeachingAssignment", teachingAssignmentSchema);
