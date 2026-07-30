import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    department: { type: String, trim: true },
    subjectsAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  },
  { timestamps: true }
);

staffSchema.index({ subjectsAssigned: 1 });
staffSchema.index({ department: 1 });

export default mongoose.model("Staff", staffSchema);
