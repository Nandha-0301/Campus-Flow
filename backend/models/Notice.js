import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: ["exam", "event", "general"], default: "general", index: true },
    targetRoles: [{ type: String, enum: ["admin", "staff", "student", "parent"], index: true }],
    targetClassIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class", index: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ targetRoles: 1, targetClassIds: 1, createdAt: -1 });

export default mongoose.model("Notice", noticeSchema);
