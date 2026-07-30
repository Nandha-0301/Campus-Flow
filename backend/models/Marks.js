import mongoose from "mongoose";

const marksSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    internal1: { type: Number, required: true, min: 0, max: 20 },
    internal2: { type: Number, required: true, min: 0, max: 20 },
    assignment: { type: Number, required: true, min: 0, max: 20 },
    external: { type: Number, required: true, min: 0, max: 40 },
    total: { type: Number, min: 0, max: 100 },
    submitted: {
      internal1: { type: Boolean, default: false },
      internal2: { type: Boolean, default: false },
      assignment: { type: Boolean, default: false },
      final: { type: Boolean, default: false },
    },
    lastExamType: { type: String, enum: ["internal1", "internal2", "assignment", "final"] },
    lastMarks: { type: Number, min: 0, max: 40 },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  },
  { timestamps: true }
);

marksSchema.pre("save", function (next) {
  this.total = (this.internal1 || 0) + (this.internal2 || 0) + (this.assignment || 0) + (this.external || 0);
  next();
});

marksSchema.index({ studentId: 1, subjectId: 1, classId: 1 }, { unique: true });
marksSchema.index({ staffId: 1, updatedAt: -1 });
marksSchema.index({ studentId: 1, updatedAt: -1 });

export default mongoose.model("Marks", marksSchema);