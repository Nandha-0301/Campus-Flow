import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Announcement from "../models/Announcement.js";
import ActivityLog from "../models/ActivityLog.js";
import Attendance from "../models/Attendance.js";
import Exam from "../models/Exam.js";
import Marks from "../models/Marks.js";
import Notice from "../models/Notice.js";
import Timetable from "../models/Timetable.js";
import Staff from "../models/Staff.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import User from "../models/User.js";
import { buildNoticeQuery } from "../utils/noticeFilters.js";
import { formatClassName } from "../utils/classResolver.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { isDateString, isMongoObjectId, isNonEmptyString, normalizeDateOnly, toNumber, toTrimmed } from "../utils/validators.js";
import Class from "../models/Class.js";
import TeachingAssignment from "../models/TeachingAssignment.js";
import { sendNotification } from "../services/notificationService.js";
import { NOTIFICATION_TYPES } from "../constants/notificationTypes.js";

const getStaffProfile = async (userId) =>
  Staff.findOne({ userId }).populate("subjectsAssigned", "_id name code branch semester").lean();

const ensureStaffCanManageSubject = (staff, subjectId) =>
  staff.subjectsAssigned.some((subject) => String(subject._id) === String(subjectId));

const validateStudentsForSubject = async (studentIds, subject) => {
  const students = await Student.find({ _id: { $in: studentIds } })
    .select("_id branch semester section classId")
    .lean();
  const foundSet = new Set(students.map((s) => String(s._id)));

  const missing = studentIds.filter((id) => !foundSet.has(String(id)));
  const invalidForSubject = students
    .filter((s) => s.branch !== subject.branch || s.semester !== subject.semester)
    .map((s) => String(s._id));

  return { missing, invalidForSubject };
};

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const getDayRank = (day) => {
  const index = DAY_ORDER.indexOf(day);
  return index === -1 ? DAY_ORDER.length : index;
};

export const getStaffDashboard = async (req, res) => {
  try {
    const staff = await getStaffProfile(req.user.userId);
    if (!staff) {
      return sendError(res, "Staff profile not found", 404);
    }

    const subjectIds = staff.subjectsAssigned.map((subject) => subject._id);
    const today = normalizeDateOnly(new Date());

    const [todayAttendanceCount, pendingAssignments, recentMarks, upcomingExams, timetableRows] = await Promise.all([
      Attendance.countDocuments({ markedBy: staff._id, date: today }),
      Assignment.find({
        $and: [
          { deadline: { $gte: new Date() } },
          { $or: [{ staffId: staff._id }, { assignedBy: staff._id }] },
        ],
      })
        .sort({ deadline: 1 })
        .limit(5)
        .populate("subjectId", "name code")
        .populate("classId", "_id className branch semester section")
        .lean(),
      Marks.find({ updatedBy: staff._id })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate("subjectId", "name code")
        .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
        .lean(),
      Exam.find({ subjectId: { $in: subjectIds }, date: { $gte: new Date() } })
        .sort({ date: 1 })
        .limit(5)
        .populate("subjectId", "name code")
        .lean(),
      Timetable.find({ staffId: staff._id })
        .populate("classId", "_id className branch semester section")
        .populate("subjectId", "_id name code")
        .sort({ day: 1, startTime: 1 })
        .lean(),
    ]);

    const classIds = [...new Set(timetableRows.map((row) => String(row.classId?._id || ""))).filter(Boolean)];
    const noticeQuery = buildNoticeQuery({ role: "staff", classIds });
    const recentNotices = await Notice.find(noticeQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("createdBy", "name role")
      .lean();

    return sendSuccess(
      res,
      {
        staff,
        stats: {
          assignedSubjects: staff.subjectsAssigned.length,
          attendanceEntriesToday: todayAttendanceCount,
          pendingAssignments: pendingAssignments.length,
          recentMarksUpdated: recentMarks.length,
        },
        subjects: staff.subjectsAssigned,
        pendingAssignments,
        recentMarks,
        upcomingExams,
        timetable: timetableRows,
        recentNotices,
      },
      "Staff dashboard fetched successfully"
    );
  } catch (error) {
    return sendError(res, "Failed to fetch staff dashboard", 500, [error.message]);
  }
};

export const getStaffTimetable = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user.userId }).lean();
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const assignments = await TeachingAssignment.find({ staffId: staff._id })
      .select("classId subjectId")
      .lean();

    const assignmentMatches = assignments.map((assignment) => ({
      classId: assignment.classId,
      subjectId: assignment.subjectId,
    }));

    const timetableFilter = assignmentMatches.length
      ? { $or: [{ staffId: staff._id }, ...assignmentMatches] }
      : { staffId: staff._id };

    const timetableRows = await Timetable.find(timetableFilter)
      .populate("classId", "_id className branch semester section")
      .populate("subjectId", "_id name code")
      .sort({ day: 1, startTime: 1, endTime: 1 })
      .lean();

    const timetable = timetableRows
      .sort((a, b) => {
        const dayDifference = getDayRank(a.day) - getDayRank(b.day);
        if (dayDifference !== 0) return dayDifference;
        const startDifference = String(a.startTime || "").localeCompare(String(b.startTime || ""));
        if (startDifference !== 0) return startDifference;
        return String(a.endTime || "").localeCompare(String(b.endTime || ""));
      })
      .map((row) => ({
        _id: row._id,
        day: row.day,
        time: `${row.startTime} - ${row.endTime}`,
        startTime: row.startTime,
        endTime: row.endTime,
        subject: row.subjectId
          ? {
              _id: row.subjectId._id,
              name: row.subjectId.name,
              code: row.subjectId.code,
            }
          : null,
        class: row.classId
          ? {
              _id: row.classId._id,
              name:
                row.classId.className ||
                formatClassName(row.classId.branch, row.classId.semester, row.classId.section),
              className: row.classId.className,
              branch: row.classId.branch,
              semester: row.classId.semester,
              section: row.classId.section,
            }
          : null,
        room: row.room || null,
      }));

    return sendSuccess(res, { timetable }, "Staff timetable fetched successfully");
  } catch (error) {
    return sendError(res, "Failed to fetch staff timetable", 500, [error.message]);
  }
};

export const getStudentsForStaff = async (req, res) => {
  try {
    const staff = await getStaffProfile(req.user.userId);
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const subjectId = req.query.subjectId;
    if (!subjectId || !isMongoObjectId(subjectId)) {
      return sendError(res, "subjectId query parameter is required", 400);
    }

    if (!ensureStaffCanManageSubject(staff, subjectId)) {
      return sendError(res, "You are not assigned to this subject", 403);
    }

    const subject = await Subject.findById(subjectId).lean();
    if (!subject) return sendError(res, "Subject not found", 404);

    const criteria = { branch: subject.branch, semester: subject.semester };

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 200)));
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find(criteria)
        .populate("userId", "name email")
        .sort({ section: 1, usn: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(criteria),
    ]);

    return sendSuccess(
      res,
      { subject, students },
      "Students fetched successfully",
      200,
      {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    return sendError(res, "Failed to fetch students", 500, [error.message]);
  }
};

export const createAssignment = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user.userId }).lean();
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const { title, type, subjectId, classId, maxMarks, deadline, description } = req.body;

    const errors = [];
    if (!isNonEmptyString(title)) errors.push("title is required");
    if (!isMongoObjectId(subjectId)) errors.push("subjectId must be a valid ObjectId");
    if (!isMongoObjectId(classId)) errors.push("classId must be a valid ObjectId");
    const allowedTypes = ["WRITING", "SEMINAR", "PROJECT", "PRESENTATION"];
    if (!allowedTypes.includes(type)) errors.push("type must be WRITING/SEMINAR/PROJECT/PRESENTATION");
    const marksValue = toNumber(maxMarks);
    if (marksValue === null || marksValue <= 0) errors.push("maxMarks must be a positive number");

    const hasDeadline = isNonEmptyString(deadline);
    if (hasDeadline && !isDateString(deadline)) errors.push("deadline must be a valid date");

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const normalizedDeadline = hasDeadline ? normalizeDateOnly(deadline) : null;
    const today = normalizeDateOnly(new Date());
    if (normalizedDeadline && normalizedDeadline < today) {
      return sendError(res, "deadline must be today or in the future", 400);
    }

    const assignmentLink = await TeachingAssignment.findOne({ staffId: staff._id, classId, subjectId }).lean();
    if (!assignmentLink) {
      return sendError(res, "You are not assigned to this class/subject", 403);
    }

    const assignment = await Assignment.create({
      title: toTrimmed(title),
      type,
      subjectId,
      classId,
      staffId: staff._id,
      maxMarks: marksValue,
      deadline: normalizedDeadline,
      description: description ? toTrimmed(description) : "",
      assignedBy: staff._id,
    });

    const populated = await Assignment.findById(assignment._id)
      .populate("subjectId", "name code branch semester")
      .populate("classId", "_id className branch semester section")
      .populate({ path: "staffId", select: "userId department", populate: { path: "userId", select: "name email role" } })
      .lean();

    return sendSuccess(res, { assignment: populated }, "Assignment created successfully", 201);
  } catch (error) {
    return sendError(res, "Failed to create assignment", 500, [error.message]);
  }
};
export const getAcademicAssignments = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user.userId }).lean();
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const { classId, subjectId } = req.query;
    const errors = [];
    if (classId && !isMongoObjectId(classId)) errors.push("classId must be a valid ObjectId");
    if (subjectId && !isMongoObjectId(subjectId)) errors.push("subjectId must be a valid ObjectId");

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const filter = { $or: [{ staffId: staff._id }, { assignedBy: staff._id }] };
    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;

    const assignments = await Assignment.find(filter)
      .sort({ createdAt: -1 })
      .populate("subjectId", "name code branch semester")
      .populate("classId", "_id className branch semester section")
      .lean();

    return sendSuccess(res, { assignments }, "Assignments fetched successfully");
  } catch (error) {
    return sendError(res, "Failed to fetch assignments", 500, [error.message]);
  }
};

export const updateAcademicAssignment = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user.userId }).lean();
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const { assignmentId } = req.params;
    if (!isMongoObjectId(assignmentId)) {
      return sendError(res, "Invalid assignment id", 400);
    }

    const { title, type, subjectId, classId, maxMarks, deadline, description } = req.body;

    const errors = [];
    if (!isNonEmptyString(title)) errors.push("title is required");
    if (!isMongoObjectId(subjectId)) errors.push("subjectId must be a valid ObjectId");
    if (!isMongoObjectId(classId)) errors.push("classId must be a valid ObjectId");
    const allowedTypes = ["WRITING", "SEMINAR", "PROJECT", "PRESENTATION"];
    if (!allowedTypes.includes(type)) errors.push("type must be WRITING/SEMINAR/PROJECT/PRESENTATION");
    const marksValue = toNumber(maxMarks);
    if (marksValue === null || marksValue <= 0) errors.push("maxMarks must be a positive number");

    const hasDeadline = deadline !== undefined && isNonEmptyString(deadline);
    if (deadline !== undefined && hasDeadline && !isDateString(deadline)) {
      errors.push("deadline must be a valid date");
    }

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const normalizedDeadline = hasDeadline ? normalizeDateOnly(deadline) : null;
    const today = normalizeDateOnly(new Date());
    if (normalizedDeadline && normalizedDeadline < today) {
      return sendError(res, "deadline must be today or in the future", 400);
    }

    const assignmentLink = await TeachingAssignment.findOne({ staffId: staff._id, classId, subjectId }).lean();
    if (!assignmentLink) {
      return sendError(res, "You are not assigned to this class/subject", 403);
    }

    const updatePayload = {
      title: toTrimmed(title),
      type,
      subjectId,
      classId,
      staffId: staff._id,
      maxMarks: marksValue,
      description: description ? toTrimmed(description) : "",
      assignedBy: staff._id,
    };

    if (deadline !== undefined) {
      updatePayload.deadline = normalizedDeadline;
    }

    const updated = await Assignment.findOneAndUpdate(
      { _id: assignmentId, $or: [{ staffId: staff._id }, { assignedBy: staff._id }] },
      { $set: updatePayload },
      { new: true }
    )
      .populate("subjectId", "name code branch semester")
      .populate("classId", "_id className branch semester section")
      .lean();

    if (!updated) {
      return sendError(res, "Assignment not found", 404);
    }

    return sendSuccess(res, { assignment: updated }, "Assignment updated successfully");
  } catch (error) {
    return sendError(res, "Failed to update assignment", 500, [error.message]);
  }
};

export const deleteAcademicAssignment = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user.userId }).lean();
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const { assignmentId } = req.params;
    if (!isMongoObjectId(assignmentId)) {
      return sendError(res, "Invalid assignment id", 400);
    }

    const removed = await Assignment.findOneAndDelete({
      _id: assignmentId,
      $or: [{ staffId: staff._id }, { assignedBy: staff._id }],
    }).lean();

    if (!removed) {
      return sendError(res, "Assignment not found", 404);
    }

    await AssignmentSubmission.deleteMany({ assignmentId });

    return sendSuccess(res, { id: assignmentId }, "Assignment deleted successfully");
  } catch (error) {
    return sendError(res, "Failed to delete assignment", 500, [error.message]);
  }
};

export const getAcademicAssignmentSubmissions = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user.userId }).lean();
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const { assignmentId } = req.params;
    if (!isMongoObjectId(assignmentId)) {
      return sendError(res, "Invalid assignment id", 400);
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      $or: [{ staffId: staff._id }, { assignedBy: staff._id }],
    })
      .populate("subjectId", "name code branch semester")
      .populate("classId", "_id className branch semester section")
      .lean();

    if (!assignment) {
      return sendError(res, "Assignment not found", 404);
    }

    const [students, submissions] = await Promise.all([
      Student.find({ classId: assignment.classId })
        .populate("userId", "name email")
        .sort({ section: 1, usn: 1 })
        .lean(),
      AssignmentSubmission.find({ assignmentId })
        .select("studentId marks status")
        .lean(),
    ]);

    return sendSuccess(res, { assignment, students, submissions }, "Assignment submissions fetched successfully");
  } catch (error) {
    return sendError(res, "Failed to fetch assignment submissions", 500, [error.message]);
  }
};

export const saveAcademicAssignmentMarks = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user.userId }).lean();
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const { assignmentId } = req.params;
    if (!isMongoObjectId(assignmentId)) {
      return sendError(res, "Invalid assignment id", 400);
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      $or: [{ staffId: staff._id }, { assignedBy: staff._id }],
    }).lean();

    if (!assignment) {
      return sendError(res, "Assignment not found", 404);
    }

    const assignmentLink = await TeachingAssignment.findOne({
      staffId: staff._id,
      classId: assignment.classId,
      subjectId: assignment.subjectId,
    }).lean();

    if (!assignmentLink) {
      return sendError(res, "You are not assigned to this class/subject", 403);
    }

    const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
    if (!entries.length) {
      return sendError(res, "entries must be a non-empty array", 400);
    }

    const errors = [];
    const allowedStatuses = ["submitted", "pending"];
    const rawStudentIds = entries.map((item) => String(item.studentId || ""));
    const studentIds = [...new Set(rawStudentIds)];
    if (studentIds.length != rawStudentIds.length) {
      errors.push("Duplicate studentId found in assignment entries");
    }

    entries.forEach((item, index) => {
      if (!isMongoObjectId(item.studentId)) errors.push(`Row ${index + 1}: invalid studentId`);
      const status = item.status || "pending";
      if (!allowedStatuses.includes(status)) errors.push(`Row ${index + 1}: status must be submitted/pending`);
      const marksValue = item.marks === null || item.marks === "" || item.marks === undefined ? null : toNumber(item.marks);
      if (status === "submitted") {
        if (marksValue === null) errors.push(`Row ${index + 1}: marks are required`);
        if (marksValue !== null && (marksValue < 0 || marksValue > assignment.maxMarks)) {
          errors.push(`Row ${index + 1}: marks must be 0-${assignment.maxMarks}`);
        }
      } else if (marksValue !== null && (marksValue < 0 || marksValue > assignment.maxMarks)) {
        errors.push(`Row ${index + 1}: marks must be 0-${assignment.maxMarks}`);
      }
    });

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const students = await Student.find({ _id: { $in: studentIds }, classId: assignment.classId })
      .select("_id")
      .lean();
    const foundSet = new Set(students.map((s) => String(s._id)));
    const missing = studentIds.filter((id) => !foundSet.has(String(id)));

    if (missing.length) {
      return sendError(res, "Some students are not part of this class", 400, [`missing=${missing.join(",")}`]);
    }

    const bulkOps = entries.map((item) => {
      const status = item.status || "pending";
      const marksValue = item.marks === null || item.marks === "" || item.marks === undefined ? null : toNumber(item.marks);
      return {
        updateOne: {
          filter: { assignmentId, studentId: item.studentId },
          update: {
            $set: {
              assignmentId,
              studentId: item.studentId,
              classId: assignment.classId,
              subjectId: assignment.subjectId,
              staffId: staff._id,
              marks: marksValue,
              status,
            },
          },
          upsert: true,
        },
      };
    });

    const result = await AssignmentSubmission.bulkWrite(bulkOps, { ordered: false });

    return sendSuccess(
      res,
      {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount,
      },
      "Assignment marks saved successfully"
    );
  } catch (error) {
    return sendError(res, "Failed to save assignment marks", 500, [error.message]);
  }
};


export const getStaffAssignments = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user.userId }).lean();
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const assignments = await TeachingAssignment.find({ staffId: staff._id })
      .populate("classId", "_id className branch semester section")
      .populate("subjectId", "_id name code branch semester")
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, { assignments }, "Staff assignments fetched successfully");
  } catch (error) {
    return sendError(res, "Failed to fetch staff assignments", 500, [error.message]);
  }
};

export const getStaffClasses = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user.userId }).lean();
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const classIds = await TeachingAssignment.distinct("classId", { staffId: staff._id });
    const classes = classIds.length
      ? await Class.find({ _id: { $in: classIds } })
          .sort({ branch: 1, semester: 1, section: 1 })
          .lean()
      : [];

    return sendSuccess(res, { classes }, "Staff classes fetched successfully");
  } catch (error) {
    return sendError(res, "Failed to fetch staff classes", 500, [error.message]);
  }
};

export const getStaffClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!isMongoObjectId(classId)) {
      return sendError(res, "Invalid class id", 400);
    }

    const staff = await Staff.findOne({ userId: req.user.userId }).lean();
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const assignment = await TeachingAssignment.findOne({ staffId: staff._id, classId }).lean();
    if (!assignment) {
      return sendError(res, "You are not assigned to this class", 403);
    }

    const [classDoc, students] = await Promise.all([
      Class.findById(classId).lean(),
      Student.find({ classId })
        .populate("userId", "name email")
        .sort({ section: 1, usn: 1 })
        .lean(),
    ]);

    return sendSuccess(res, { class: classDoc, students }, "Students fetched successfully");
  } catch (error) {
    return sendError(res, "Failed to fetch students", 500, [error.message]);
  }
};

export const recordAttendance = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user.userId }).lean();
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const { classId, subjectId, date } = req.body;
    const entries = Array.isArray(req.body.entries)
      ? req.body.entries
      : Array.isArray(req.body.students)
        ? req.body.students
        : req.body.studentId
          ? [{ studentId: req.body.studentId, status: req.body.status }]
          : [];

    const errors = [];
    if (!isMongoObjectId(classId)) errors.push("classId must be a valid ObjectId");
    if (!isMongoObjectId(subjectId)) errors.push("subjectId must be a valid ObjectId");
    if (!isDateString(date)) errors.push("date must be a valid date");
    if (!entries.length) errors.push("entries must be a non-empty array");

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const normalizedDate = normalizeDateOnly(date);
    const today = normalizeDateOnly(new Date());
    if (normalizedDate > today) {
      return sendError(res, "Attendance date cannot be in the future", 400);
    }

    const assignment = await TeachingAssignment.findOne({ staffId: staff._id, classId, subjectId }).lean();
    if (!assignment) {
      return sendError(res, "You are not assigned to this class/subject", 403);
    }

    const invalidEntries = entries.filter(
      (item) => !isMongoObjectId(item.studentId) || !["present", "absent"].includes(item.status)
    );
    if (invalidEntries.length) {
      return sendError(res, "Each entry must include valid studentId and status(present/absent)", 400, [
        `invalidRows=${invalidEntries.length}`,
      ]);
    }

    const rawStudentIds = entries.map((item) => String(item.studentId));
    const studentIds = [...new Set(rawStudentIds)];

    if (studentIds.length !== rawStudentIds.length) {
      return sendError(res, "Duplicate studentId found in attendance entries", 400);
    }
    const students = await Student.find({ _id: { $in: studentIds }, classId }).select("_id").lean();
    const foundSet = new Set(students.map((s) => String(s._id)));
    const missing = studentIds.filter((id) => !foundSet.has(String(id)));

    if (missing.length) {
      return sendError(res, "Some students are not part of this class", 400, [`missing=${missing.join(",")}`]);
    }

    const allowUpdate = Boolean(req.body.allowUpdate);

    const existing = await Attendance.find({
      studentId: { $in: studentIds },
      subjectId,
      classId,
      date: normalizedDate,
    })
      .select("studentId")
      .lean();

    if (existing.length && !allowUpdate) {
      return sendError(res, "Attendance already exists for some students on this date", 409, [
        ...existing.map((row) => String(row.studentId)),
      ]);
    }

    const absentEntries = entries.filter((item) => item.status === "absent");
    const notificationsQueued = absentEntries.length;

    const queueAbsenceNotifications = () => {
      if (!absentEntries.length) return;
      const absentIds = absentEntries.map((item) => item.studentId);
      setImmediate(async () => {
        try {
          const [subject, classDoc, staffUser, absentStudents] = await Promise.all([
            Subject.findById(subjectId).select("name").lean(),
            Class.findById(classId).select("className branch semester section").lean(),
            User.findById(staff.userId).select("name").lean(),
            Student.find({ _id: { $in: absentIds }, classId })
              .populate("userId", "name")
              .populate("parentId", "email name")
              .lean(),
          ]);

          const className =
            classDoc?.className ||
            (classDoc ? formatClassName(classDoc.branch, classDoc.semester, classDoc.section) : "");
          const subjectName = subject?.name || "Subject";
          const staffName = staffUser?.name || "Staff";

          await Promise.all(
            absentStudents.map((student) =>
              sendNotification(student, NOTIFICATION_TYPES.ABSENT, {
                subjectId,
                classId,
                subjectName,
                className,
                staffName,
                staffId: staff._id,
                date: normalizedDate,
              })
            )
          );
        } catch (err) {
          console.error("Notification error:", err);
        }
      });
    };

    if (allowUpdate) {
      const bulkOps = entries.map((item) => ({
        updateOne: {
          filter: {
            studentId: item.studentId,
            subjectId,
            classId,
            date: normalizedDate,
          },
          update: {
            $set: {
              studentId: item.studentId,
              subjectId,
              classId,
              date: normalizedDate,
              status: item.status,
              staffId: staff._id,
              markedBy: staff._id,
            },
          },
          upsert: true,
        },
      }));

      const result = await Attendance.bulkWrite(bulkOps, { ordered: false });
      queueAbsenceNotifications();

      return sendSuccess(
        res,
        {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          upsertedCount: result.upsertedCount,
          notificationsQueued,
        },
        "Attendance updated successfully"
      );
    }

    const docs = entries.map((item) => ({
      studentId: item.studentId,
      subjectId,
      classId,
      date: normalizedDate,
      status: item.status,
      staffId: staff._id,
      markedBy: staff._id,
    }));

    const inserted = await Attendance.insertMany(docs, { ordered: false });
    queueAbsenceNotifications();

    return sendSuccess(
      res,
      {
        insertedCount: inserted.length,
        notificationsQueued,
      },
      "Attendance saved successfully",
      201
    );
  } catch (error) {
    return sendError(res, "Failed to save attendance", 500, [error.message]);
  }
};

export const recordMarks = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user.userId }).lean();
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const { classId, subjectId, examType } = req.body;
    const entries = Array.isArray(req.body.entries)
      ? req.body.entries
      : Array.isArray(req.body.students)
        ? req.body.students
        : req.body.studentId
          ? [{ studentId: req.body.studentId, marks: req.body.marks }]
          : [];

    const examMap = {
      internal1: { field: "internal1", max: 20, flag: "internal1" },
      internal2: { field: "internal2", max: 20, flag: "internal2" },
      assignment: { field: "assignment", max: 20, flag: "assignment" },
      final: { field: "external", max: 40, flag: "final" },
    };

    const errors = [];
    if (!isMongoObjectId(classId)) errors.push("classId must be a valid ObjectId");
    if (!isMongoObjectId(subjectId)) errors.push("subjectId must be a valid ObjectId");
    if (!examMap[examType]) errors.push("examType must be internal1/internal2/assignment/final");
    if (!entries.length) errors.push("entries must be a non-empty array");

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const assignment = await TeachingAssignment.findOne({ staffId: staff._id, classId, subjectId }).lean();
    if (!assignment) {
      return sendError(res, "You are not assigned to this class/subject", 403);
    }

    const { field, max, flag } = examMap[examType];
    const allowUpdate = Boolean(req.body.allowUpdate);
    const invalidRows = [];

    for (const [index, item] of entries.entries()) {
      const rawMarks = item.marks;
      const markValue = toNumber(rawMarks);
      if (!isMongoObjectId(item.studentId)) invalidRows.push(`Row ${index + 1}: invalid studentId`);
      if (rawMarks === undefined || rawMarks === null || rawMarks === "") {
        invalidRows.push(`Row ${index + 1}: marks are required`);
      } else if (markValue === null || markValue < 0 || markValue > max) {
        invalidRows.push(`Row ${index + 1}: marks must be 0-${max}`);
      }
    }

    if (invalidRows.length) {
      return sendError(res, "Validation failed", 400, invalidRows);
    }

    const rawStudentIds = entries.map((item) => String(item.studentId));
    const studentIds = [...new Set(rawStudentIds)];

    if (studentIds.length !== rawStudentIds.length) {
      return sendError(res, "Duplicate studentId found in marks entries", 400);
    }
    const students = await Student.find({ _id: { $in: studentIds }, classId }).select("_id").lean();
    const foundSet = new Set(students.map((s) => String(s._id)));
    const missing = studentIds.filter((id) => !foundSet.has(String(id)));

    if (missing.length) {
      return sendError(res, "Some students are not part of this class", 400, [`missing=${missing.join(",")}`]);
    }

    const existing = await Marks.find({
      studentId: { $in: studentIds },
      subjectId,
      $or: [{ classId }, { classId: { $exists: false } }, { classId: null }],
    }).lean();
    const existingMap = new Map(existing.map((row) => [String(row.studentId), row]));

    if (!allowUpdate) {
      const duplicates = studentIds.filter((id) => {
        const row = existingMap.get(String(id));
        if (!row) return false;
        const submittedFlag = row.submitted ? row.submitted[flag] : undefined;
        if (submittedFlag !== undefined) return Boolean(submittedFlag);
        const fieldValue = row[field];
        return fieldValue !== undefined && fieldValue !== null;
      });
      if (duplicates.length) {
        return sendError(res, "Marks already submitted for this exam type", 409, duplicates);
      }
    }

    const bulkOps = entries.map((item) => {
      const current = existingMap.get(String(item.studentId)) || {};
      const currentSubmitted = current.submitted || {};
      const internal1 = field === "internal1" ? Number(item.marks) : Number(current.internal1 || 0);
      const internal2 = field === "internal2" ? Number(item.marks) : Number(current.internal2 || 0);
      const assignmentScore = field === "assignment" ? Number(item.marks) : Number(current.assignment || 0);
      const external = field === "external" ? Number(item.marks) : Number(current.external || 0);
      const total = internal1 + internal2 + assignmentScore + external;

      return {
        updateOne: {
          filter: current._id ? { _id: current._id } : { studentId: item.studentId, subjectId, classId },
          update: {
            $set: {
              studentId: item.studentId,
              subjectId,
              classId,
              internal1,
              internal2,
              assignment: assignmentScore,
              external,
              total,
              submitted: { ...currentSubmitted, [flag]: true },
              lastExamType: examType,
              lastMarks: Number(item.marks),
              staffId: staff._id,
              updatedBy: staff._id,
            },
          },
          upsert: true,
        },
      };
    });

    const result = await Marks.bulkWrite(bulkOps, { ordered: false });

    return sendSuccess(
      res,
      {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount,
      },
      "Marks saved successfully"
    );
  } catch (error) {
    return sendError(res, "Failed to save marks", 500, [error.message]);
  }
};


export const getStaffAttendance = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user.userId }).lean();
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const { classId, subjectId, date } = req.query;

    const errors = [];
    if (!isMongoObjectId(classId)) errors.push("classId must be a valid ObjectId");
    if (!isMongoObjectId(subjectId)) errors.push("subjectId must be a valid ObjectId");
    if (!isDateString(date)) errors.push("date must be a valid date");

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const assignment = await TeachingAssignment.findOne({ staffId: staff._id, classId, subjectId }).lean();
    if (!assignment) {
      return sendError(res, "You are not assigned to this class/subject", 403);
    }

    const normalizedDate = normalizeDateOnly(date);

    const attendance = await Attendance.find({ classId, subjectId, date: normalizedDate })
      .select("studentId status")
      .lean();

    return sendSuccess(res, { attendance }, "Attendance fetched successfully");
  } catch (error) {
    return sendError(res, "Failed to fetch attendance", 500, [error.message]);
  }
};

export const getStaffMarks = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user.userId }).lean();
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const { classId, subjectId, examType } = req.query;

    const errors = [];
    if (!isMongoObjectId(classId)) errors.push("classId must be a valid ObjectId");
    if (!isMongoObjectId(subjectId)) errors.push("subjectId must be a valid ObjectId");
    if (!examType) errors.push("examType is required");
    const allowedExamTypes = ["internal1", "internal2", "assignment", "final"];
    if (examType && !allowedExamTypes.includes(examType)) errors.push("examType is invalid");

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const assignment = await TeachingAssignment.findOne({ staffId: staff._id, classId, subjectId }).lean();
    if (!assignment) {
      return sendError(res, "You are not assigned to this class/subject", 403);
    }

    const marks = await Marks.find({ classId, subjectId })
      .select("studentId internal1 internal2 assignment external submitted")
      .lean();

    return sendSuccess(res, { marks }, "Marks fetched successfully");
  } catch (error) {
    return sendError(res, "Failed to fetch marks", 500, [error.message]);
  }
};

export const createStaffAnnouncement = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user.userId }).lean();
    if (!staff) return sendError(res, "Staff profile not found", 404);

    const { title, description, type, target, classId, isActive = true } = req.body;

    const errors = [];
    if (!isNonEmptyString(title)) errors.push("title is required");
    if (!isNonEmptyString(description)) errors.push("description is required");
    if (!isMongoObjectId(classId)) errors.push("classId must be a valid ObjectId");
    const allowedTypes = ["HOLIDAY", "EXAM", "INTERNAL", "EVENT", "GENERAL"];
    if (!allowedTypes.includes(type)) errors.push("type must be HOLIDAY/EXAM/INTERNAL/EVENT/GENERAL");
    const allowedTargets = ["STUDENTS", "PARENTS"];
    if (!allowedTargets.includes(target)) errors.push("target must be STUDENTS/PARENTS");

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const assignment = await TeachingAssignment.findOne({ staffId: staff._id, classId }).lean();
    if (!assignment) {
      return sendError(res, "Unauthorized class access", 403);
    }

    const announcement = await Announcement.create({
      title: toTrimmed(title),
      description: toTrimmed(description),
      type,
      target,
      classId,
      createdBy: req.user.userId,
      isActive: Boolean(isActive),
    });

    ActivityLog.create({
      action: "Announcement created (staff)",
      actionType: "ANNOUNCEMENT",
      performedBy: req.user.userId,
      entity: { type: "Announcement", id: announcement._id, name: announcement.title },
    }).catch((logError) => console.error("ActivityLog error:", logError));

    return sendSuccess(res, { announcement }, "Announcement created", 201);
  } catch (error) {
    return sendError(res, "Failed to create announcement", 500, [error.message]);
  }
};















