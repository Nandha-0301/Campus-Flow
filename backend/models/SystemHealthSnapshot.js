import mongoose from "mongoose";

const systemHealthSnapshotSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true, unique: true, index: true },
    totalClasses: { type: Number, default: 0 },
    healthyCount: { type: Number, default: 0 },
    misconfiguredCount: { type: Number, default: 0 },
    warningCount: { type: Number, default: 0 },
    infoCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("SystemHealthSnapshot", systemHealthSnapshotSchema);
