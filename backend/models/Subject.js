import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    branch: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  },
  { timestamps: true }
);

subjectSchema.index({ classId: 1 });
subjectSchema.index({ branch: 1, semester: 1 });
subjectSchema.index({ assignedStaff: 1 });

export default mongoose.model("Subject", subjectSchema);
