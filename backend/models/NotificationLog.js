import mongoose from "mongoose";

const notificationLogSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    type: { type: String, enum: ["ABSENT", "MARKS"], required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null },
    examType: { type: String, default: null },
    date: { type: Date, default: null },
    status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
    channels: [{ type: String, enum: ["sms", "email"] }],
    error: { type: String, default: "" },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

notificationLogSchema.index(
  { studentId: 1, type: 1, subjectId: 1, date: 1 },
  { unique: true, partialFilterExpression: { type: "ABSENT" } }
);
notificationLogSchema.index(
  { studentId: 1, type: 1, subjectId: 1, examType: 1 },
  { unique: true, partialFilterExpression: { type: "MARKS" } }
);

export default mongoose.model("NotificationLog", notificationLogSchema);

