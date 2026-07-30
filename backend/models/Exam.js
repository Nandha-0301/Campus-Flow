import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    date: { type: Date, required: true, index: true },
    type: { type: String, enum: ["internal", "final"], required: true },
    hall: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

examSchema.index({ subjectId: 1, date: 1, type: 1 });

export default mongoose.model("Exam", examSchema);
