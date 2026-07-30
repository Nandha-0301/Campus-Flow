import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUID: { type: String, required: true, unique: true, index: true },
    name: { type: String, trim: true, default: "" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ["admin", "staff", "student", "parent"],
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    permissions: [{ type: String, trim: true, index: true }],
  },
  { timestamps: true }
);

userSchema.index({ email: 1, role: 1 });
userSchema.index({ role: 1, isActive: 1 });

export default mongoose.model("User", userSchema);
