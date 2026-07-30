import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    usn: { type: String, required: true, unique: true, uppercase: true, trim: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    branch: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    section: { type: String, required: true, trim: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    parentPhone: { type: String, trim: true, default: "" },
    parentEmail: { type: String, trim: true, lowercase: true, default: "" },
    assignedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  },
  { timestamps: true }
);

studentSchema.index({ assignedSubjects: 1 });
studentSchema.index({ parentId: 1 });
studentSchema.index({ classId: 1 });
studentSchema.index({ branch: 1, semester: 1, section: 1 });

export default mongoose.model("Student", studentSchema);

