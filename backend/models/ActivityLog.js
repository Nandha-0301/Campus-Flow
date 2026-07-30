import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    actionType: { type: String, trim: true, index: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    entity: {
      type: { type: String, trim: true },
      id: { type: mongoose.Schema.Types.ObjectId },
      name: { type: String, trim: true },
    },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ actionType: 1, createdAt: -1 });
activityLogSchema.index({ performedBy: 1, createdAt: -1 });

export default mongoose.model("ActivityLog", activityLogSchema);
