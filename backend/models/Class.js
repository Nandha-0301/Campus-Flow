import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    branch: { type: String, required: true, trim: true, index: true },
    semester: { type: Number, required: true, min: 1, max: 8, index: true },
    section: { type: String, required: true, trim: true, index: true },
    className: { type: String, required: true, trim: true, unique: true, index: true },
  },
  { timestamps: true }
);

classSchema.index({ branch: 1, semester: 1, section: 1 }, { unique: true });

export default mongoose.model("Class", classSchema);
