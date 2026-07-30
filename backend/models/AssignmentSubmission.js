import mongoose from "mongoose";

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    marks: { type: Number, min: 0, default: null },
    status: { type: String, enum: ["submitted", "pending"], default: "pending" },
  },
  { timestamps: true }
);

assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
assignmentSubmissionSchema.index({ classId: 1, assignmentId: 1 });
assignmentSubmissionSchema.index({ staffId: 1, updatedAt: -1 });

export default mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);
