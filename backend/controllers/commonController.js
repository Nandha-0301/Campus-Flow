import Exam from "../models/Exam.js";
import Notice from "../models/Notice.js";
import ActivityLog from "../models/ActivityLog.js";
import Class from "../models/Class.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import TeachingAssignment from "../models/TeachingAssignment.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { isDateString, isMongoObjectId, isNonEmptyString, toTrimmed } from "../utils/validators.js";
import { buildNoticeQuery } from "../utils/noticeFilters.js";
import { resolveClassForStudent } from "../utils/classResolver.js";

export const getNotices = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
    const skip = (page - 1) * limit;

    const role = req.user?.role;
    let classIds = [];

    if (role === "student") {
      const student = await Student.findOne({ userId: req.user.userId }).lean();
      if (student) {
        const classDoc = await resolveClassForStudent(student);
        if (classDoc) classIds = [classDoc._id];
      }
    }

    if (role === "parent") {
      const children = await Student.find({ parentId: req.user.userId }).lean();
      const classSet = new Set();
      for (const child of children) {
        const classDoc = await resolveClassForStudent(child);
        if (classDoc) classSet.add(String(classDoc._id));
      }
      classIds = [...classSet];
    }

    const query = buildNoticeQuery({ role, classIds });

    if (req.query.type && ["exam", "event", "general"].includes(req.query.type)) {
      if (query.$and) {
        query.$and.push({ type: req.query.type });
      } else {
        query.type = req.query.type;
      }
    }

    const [rows, total] = await Promise.all([
      Notice.find(query)
        .populate("createdBy", "name role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notice.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      { notices: rows },
      "Notices fetched successfully",
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
    return sendError(res, "Failed to fetch notices", 500, [error.message]);
  }
};

export const getSubjects = async (req, res) => {
  try {
    console.log("REQ QUERY:", req.query);
    const { semester, branch } = req.query;
    const filter = {};
    if (semester) filter.semester = Number(semester);
    if (branch) filter.branch = branch;

    const subjects = await Subject.find(filter)
      .select("_id name code branch semester")
      .sort({ branch: 1, semester: 1, code: 1 })
      .lean();

    return res.status(200).json({ success: true, subjects });
  } catch (error) {
    console.error("SUBJECT FETCH ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch subjects" });
  }
};
export const getAssignments = async (_req, res) => {
  try {
    const assignments = await TeachingAssignment.find()
      .populate({ path: "subjectId", select: "name code branch semester" })
      .populate({ path: "classId", select: "branch semester section className" })
      .populate({ path: "staffId", select: "userId department", populate: { path: "userId", select: "name email role" } })
      .sort({ createdAt: -1 })
      .lean();

    const shaped = assignments.map((assignment) => ({
      ...assignment,
      subject: assignment.subjectId || null,
      class: assignment.classId || null,
      staff: assignment.staffId || null,
    }));

    return res.status(200).json({ success: true, assignments: shaped });
  } catch (error) {
    console.error("ASSIGNMENT FETCH ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch assignments" });
  }
};

export const createNotice = async (req, res) => {
  try {
    const {
      title,
      description,
      type = "general",
      targetRoles = [],
      targetClassIds = [],
    } = req.body;

    const errors = [];
    if (!isNonEmptyString(title)) errors.push("title is required");
    if (!isNonEmptyString(description)) errors.push("description is required");
    if (!["exam", "event", "general"].includes(type)) errors.push("type must be exam/event/general");

    if (targetRoles && !Array.isArray(targetRoles)) errors.push("targetRoles must be an array");
    if (targetClassIds && !Array.isArray(targetClassIds)) errors.push("targetClassIds must be an array");

    const normalizedRoles = Array.isArray(targetRoles)
      ? [...new Set(targetRoles.filter(Boolean))]
      : [];

    const invalidRole = normalizedRoles.find((role) => !["admin", "staff", "student", "parent"].includes(role));
    if (invalidRole) errors.push("targetRoles contains invalid role values");

    const normalizedClassIds = Array.isArray(targetClassIds)
      ? [...new Set(targetClassIds.filter(Boolean).map(String))]
      : [];

    if (normalizedClassIds.some((id) => !isMongoObjectId(id))) {
      errors.push("targetClassIds must contain valid ObjectIds");
    }

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    if (normalizedClassIds.length) {
      const count = await Class.countDocuments({ _id: { $in: normalizedClassIds } });
      if (count !== normalizedClassIds.length) {
        return sendError(res, "One or more targetClassIds are invalid", 400);
      }
    }

    const notice = await Notice.create({
      title: toTrimmed(title),
      description: toTrimmed(description),
      type,
      targetRoles: normalizedRoles,
      targetClassIds: normalizedClassIds,
      createdBy: req.user.userId,
    });

    await ActivityLog.create({
      action: "Notice sent",
      actionType: "NOTICE_SENT",
      performedBy: req.user.userId,
      entity: { type: "Notice", id: notice._id, name: notice.title },
      metadata: { targetRoles: normalizedRoles, targetClassIds: normalizedClassIds },
    });

    const populated = await Notice.findById(notice._id).populate("createdBy", "name role").lean();
    return sendSuccess(res, { notice: populated }, "Notice created successfully", 201);
  } catch (error) {
    return sendError(res, "Failed to create notice", 500, [error.message]);
  }
};

export const getExams = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;
    const upcomingOnly = req.query.upcoming !== "false";

    const query = upcomingOnly ? { date: { $gte: new Date() } } : {};

    const [rows, total] = await Promise.all([
      Exam.find(query)
        .populate("subjectId", "name code branch semester")
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Exam.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      { exams: rows },
      "Exams fetched successfully",
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
    return sendError(res, "Failed to fetch exams", 500, [error.message]);
  }
};

export const createExam = async (req, res) => {
  try {
    const { subjectId, date, type, hall } = req.body;

    const errors = [];
    if (!isMongoObjectId(subjectId)) errors.push("subjectId must be a valid ObjectId");
    if (!isDateString(date)) errors.push("date must be valid");
    if (!["internal", "final"].includes(type)) errors.push("type must be internal/final");
    if (!isNonEmptyString(hall)) errors.push("hall is required");

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const subject = await Subject.findById(subjectId).lean();
    if (!subject) {
      return sendError(res, "Subject not found", 404);
    }

    const exam = await Exam.create({
      subjectId,
      date,
      type,
      hall: toTrimmed(hall),
    });

    const populated = await Exam.findById(exam._id).populate("subjectId", "name code branch semester").lean();
    return sendSuccess(res, { exam: populated }, "Exam created successfully", 201);
  } catch (error) {
    return sendError(res, "Failed to create exam", 500, [error.message]);
  }
};


