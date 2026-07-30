import ActivityLog from "../models/ActivityLog.js";
import Assignment from "../models/Assignment.js";
import Attendance from "../models/Attendance.js";
import Staff from "../models/Staff.js";
import Student from "../models/Student.js";
import Subject from "../models/Subject.js";
import Class from "../models/Class.js";
import Marks from "../models/Marks.js";
import Timetable from "../models/Timetable.js";
import TeachingAssignment from "../models/TeachingAssignment.js";
import SystemHealthSnapshot from "../models/SystemHealthSnapshot.js";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import { getFirebaseAuth } from "../config/firebaseAdmin.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { isMongoObjectId, isNonEmptyString, toTrimmed, inRange } from "../utils/validators.js";
import {
  buildStudentMatchForClass,
  formatClassName,
  normalizeClassPayload,
} from "../utils/classResolver.js";

const allowedRoles = ["admin", "staff", "student", "parent"];

const logActivity = async ({ action, actionType, performedBy, entity, metadata }) => {
  try {
    await ActivityLog.create({
      action,
      actionType,
      performedBy,
      entity,
      metadata,
    });
  } catch (error) {
    console.error("ActivityLog error:", error);
  }
};

const normalizeEmail = (value) => toTrimmed(value).toLowerCase();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const isValidEmail = (value) => emailRegex.test(String(value || "").toLowerCase());

const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const isValidTimeString = (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value || ""));

const toMinutes = (value) => {
  const [hours, minutes] = String(value).split(":").map(Number);
  return hours * 60 + minutes;
};

const buildDefaultAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  return `${year}-${year + 1}`;
};

const getOrCreateSettings = async () => {
  let settings = await Settings.findOne({ singleton: "default" }).lean();
  if (settings) return settings;

  const created = await Settings.create({
    systemName: "CampusFlow",
    academicYear: buildDefaultAcademicYear(),
    allowRegistration: true,
    defaultRole: "student",
    notifySmsEnabled: true,
    notifyEmailEnabled: true,
    notifyMarksEnabled: true,
  });

  settings = created.toObject();
  return settings;
};

const mapCountsByClass = (rows = []) => {
  const map = new Map();
  rows.forEach((row) => {
    if (!row?._id) return;
    map.set(String(row._id), row.count || 0);
  });
  return map;
};


export const createStaff = async (req, res) => {
  try {
    const { name, email, department } = req.body;

    const errors = [];
    if (!isNonEmptyString(name)) errors.push("name is required");
    if (!isNonEmptyString(email) || !isValidEmail(email)) errors.push("email must be valid");

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return sendError(res, "Email already exists", 409);
    }

    const firebaseAuth = getFirebaseAuth();
    let firebaseUser = null;

    try {
      firebaseUser = await firebaseAuth.createUser({
        email: normalizedEmail,
        password: "Temp@123",
        displayName: toTrimmed(name) || undefined,
      });
    } catch (firebaseError) {
      if (firebaseError?.code === "auth/email-already-exists") {
        return sendError(res, "Email already exists in Firebase", 409);
      }
      return sendError(res, "Failed to create Firebase user", 500, [firebaseError.message]);
    }

    const firebaseUID = firebaseUser.uid;
    let user = null;

    try {
      user = await User.create({
        firebaseUID,
        name: toTrimmed(name),
        email: normalizedEmail,
        role: "staff",
      });
    } catch (userError) {
      try {
        await firebaseAuth.deleteUser(firebaseUID);
      } catch (cleanupError) {
        console.error("Failed to cleanup Firebase user:", cleanupError);
      }
      return sendError(res, "Failed to create staff user", 500, [userError.message]);
    }

    let staffProfile = null;

    try {
      staffProfile = await Staff.create({
        userId: user._id,
        department: isNonEmptyString(department) ? toTrimmed(department) : undefined,
      });
    } catch (profileError) {
      await User.findByIdAndDelete(user._id);
      try {
        await firebaseAuth.deleteUser(firebaseUID);
      } catch (cleanupError) {
        console.error("Failed to cleanup Firebase user:", cleanupError);
      }
      return sendError(res, "Failed to create staff profile", 500, [profileError.message]);
    }

    const populated = await Staff.findById(staffProfile._id)
      .populate("userId", "name email role")
      .select("_id userId department subjectsAssigned")
      .lean();

    await logActivity({
      action: "Staff created",
      actionType: "STAFF_CREATED",
      performedBy: req.user.userId,
      entity: { type: "Staff", id: staffProfile._id, name: user.name },
    });

    return sendSuccess(res, { staff: populated }, "Staff created successfully", 201);
  } catch (error) {
    return sendError(res, "Failed to create staff", 500, [error.message]);
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isMongoObjectId(id)) {
      return sendError(res, "Invalid staff id", 400);
    }

    const staffProfile = await Staff.findById(id).populate("userId", "name email role firebaseUID");
    if (!staffProfile) {
      return sendError(res, "Staff not found", 404);
    }

    const userId = staffProfile.userId?._id;
    const firebaseUID = staffProfile.userId?.firebaseUID;

    if (firebaseUID) {
      const firebaseAuth = getFirebaseAuth();
      try {
        await firebaseAuth.deleteUser(firebaseUID);
      } catch (firebaseError) {
        if (firebaseError?.code !== "auth/user-not-found") {
          return sendError(res, "Failed to delete Firebase user", 500, [firebaseError.message]);
        }
      }
    }

    await Staff.deleteOne({ _id: staffProfile._id });
    if (userId) {
      await User.deleteOne({ _id: userId });
    }

    await logActivity({
      action: "Staff deleted",
      actionType: "STAFF_DELETED",
      performedBy: req.user.userId,
      entity: { type: "Staff", id: staffProfile._id, name: staffProfile.userId?.name },
    });

    return sendSuccess(res, { id: staffProfile._id }, "Staff deleted successfully");
  } catch (error) {
    return sendError(res, "Failed to delete staff", 500, [error.message]);
  }
};

export const createSubject = async (req, res) => {
  try {
    const { name, code, branch, semester } = req.body;

    const errors = [];
    if (!isNonEmptyString(name)) errors.push("name is required");
    if (!isNonEmptyString(code)) errors.push("code is required");
    if (!isNonEmptyString(branch)) errors.push("branch is required");
    if (!inRange(semester, 1, 8)) errors.push("semester must be 1-8");

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const normalizedCode = toTrimmed(code).toUpperCase();
    const exists = await Subject.findOne({ code: normalizedCode }).lean();
    if (exists) {
      return sendError(res, "Subject already exists", 400);
    }

    const subject = await Subject.create({
      name: toTrimmed(name),
      code: normalizedCode,
      branch: toTrimmed(branch),
      semester: Number(semester),
    });

    await logActivity({
      action: "Subject created",
      performedBy: req.user.userId,
      entity: { type: "Subject", id: subject._id, name: subject.name },
    });

    return sendSuccess(res, { subject }, "Subject created successfully", 201);
  } catch (error) {
    return sendError(res, "Failed to create subject", 500, [error.message]);
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isMongoObjectId(id)) {
      return sendError(res, "Invalid subject id", 400);
    }

    const subject = await Subject.findById(id);
    if (!subject) {
      return sendError(res, "Subject not found", 404);
    }

    const { name, code, branch, semester } = req.body;

    const errors = [];
    if (code !== undefined && !isNonEmptyString(code)) errors.push("code must be a valid string");
    if (branch !== undefined && !isNonEmptyString(branch)) errors.push("branch must be a valid string");
    if (semester !== undefined && !inRange(semester, 1, 8)) errors.push("semester must be 1-8");

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    if (isNonEmptyString(code)) {
      const normalizedCode = toTrimmed(code).toUpperCase();
      const exists = await Subject.findOne({ code: normalizedCode, _id: { $ne: subject._id } }).lean();
      if (exists) {
        return sendError(res, "Subject code already exists", 409);
      }
      subject.code = normalizedCode;
    }

    if (isNonEmptyString(name)) subject.name = toTrimmed(name);
    if (isNonEmptyString(branch)) subject.branch = toTrimmed(branch);
    if (semester !== undefined) subject.semester = Number(semester);

    await subject.save();

    await logActivity({
      action: "Subject updated",
      performedBy: req.user.userId,
      entity: { type: "Subject", id: subject._id, name: subject.name },
    });

    return sendSuccess(res, { subject }, "Subject updated successfully");
  } catch (error) {
    return sendError(res, "Failed to update subject", 500, [error.message]);
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isMongoObjectId(id)) {
      return sendError(res, "Invalid subject id", 400);
    }

    const subject = await Subject.findById(id);
    if (!subject) {
      return sendError(res, "Subject not found", 404);
    }

    const [assignmentCount, studentCount] = await Promise.all([
      TeachingAssignment.countDocuments({ subjectId: subject._id }),
      Student.countDocuments({ assignedSubjects: subject._id }),
    ]);

    if (assignmentCount > 0) {
      return sendError(res, "Cannot delete subject assigned to classes", 409, [
        `assignments=${assignmentCount}`,
      ]);
    }

    if (studentCount > 0) {
      return sendError(res, "Cannot delete subject assigned to students", 409, [
        `students=${studentCount}`,
      ]);
    }

    await Subject.deleteOne({ _id: subject._id });

    await logActivity({
      action: "Subject deleted",
      performedBy: req.user.userId,
      entity: { type: "Subject", id: subject._id, name: subject.name },
    });

    return sendSuccess(res, { id }, "Subject deleted successfully");
  } catch (error) {
    return sendError(res, "Failed to delete subject", 500, [error.message]);
  }
};

export const assignTeaching = async (req, res) => {
  try {
    const { classId, subjectId, staffId } = req.body;

    const errors = [];
    if (!isMongoObjectId(classId)) errors.push("classId must be a valid ObjectId");
    if (!isMongoObjectId(subjectId)) errors.push("subjectId must be a valid ObjectId");
    if (!isMongoObjectId(staffId)) errors.push("staffId must be a valid ObjectId");

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const [classDoc, subject, staff] = await Promise.all([
      Class.findById(classId).lean(),
      Subject.findById(subjectId).lean(),
      Staff.findById(staffId).lean(),
    ]);

    if (!classDoc) return sendError(res, "Class not found", 404);
    if (!subject) return sendError(res, "Subject not found", 404);
    if (!staff) return sendError(res, "Staff profile not found", 404);

    if (subject.branch !== classDoc.branch || subject.semester !== classDoc.semester) {
      return sendError(res, "Subject does not belong to the class branch/semester", 400);
    }

    const existing = await TeachingAssignment.findOne({ classId, subjectId }).lean();
    if (existing) {
      return sendError(res, "Teaching assignment already exists", 409);
    }

    const assignment = await TeachingAssignment.create({
      classId,
      subjectId,
      staffId,
    });

    await Staff.findByIdAndUpdate(staffId, { $addToSet: { subjectsAssigned: subjectId } });

    const populated = await TeachingAssignment.findById(assignment._id)
      .populate("classId", "_id className branch semester section")
      .populate("subjectId", "_id name code branch semester")
      .populate({ path: "staffId", populate: { path: "userId", select: "name email" }, select: "userId department" })
      .lean();

    await logActivity({
      action: "Teaching assigned",
      actionType: "TEACHING_ASSIGNED",
      performedBy: req.user.userId,
      entity: { type: "TeachingAssignment", id: assignment._id },
      metadata: { classId, subjectId, staffId },
    });

    return sendSuccess(res, { assignment: populated }, "Teaching assigned successfully", 201);
  } catch (error) {
    if (error?.code === 11000) {
    return sendError(res, "Teaching assignment already exists", 409);
  }
  return sendError(res, "Failed to assign teaching", 500, [error.message]);
  }
};

export const createClass = async (req, res) => {
  try {
    const { branch, semester, section } = req.body;

    const errors = [];
    if (!isNonEmptyString(branch)) errors.push("branch is required");
    if (!inRange(semester, 1, 8)) errors.push("semester must be 1-8");
    if (!isNonEmptyString(section)) errors.push("section is required");

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const normalized = normalizeClassPayload(branch, semester, section);
    const className = formatClassName(normalized.branch, normalized.semester, normalized.section);

    const existing = await Class.findOne({
      $or: [
        { className },
        { branch: normalized.branch, semester: normalized.semester, section: normalized.section },
      ],
    }).lean();

    if (existing) {
      return sendError(res, "Class already exists for this branch, semester, and section", 409);
    }

    const created = await Class.create({
      ...normalized,
      className,
    });

    await logActivity({
      action: "Class created",
      actionType: "CLASS_CREATED",
      performedBy: req.user.userId,
      entity: { type: "Class", id: created._id, name: created.className },
      metadata: { branch: created.branch, semester: created.semester, section: created.section },
    });

    return sendSuccess(res, { class: created }, "Class created successfully", 201);
  } catch (error) {
    if (error?.code === 11000) {
      return sendError(res, "Class already exists for this branch, semester, and section", 409);
    }
    return sendError(res, "Failed to create class", 500, [error.message]);
  }
};

export const getClasses = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 100)));
    const skip = (page - 1) * limit;

    const [classes, total] = await Promise.all([
      Class.find()
        .sort({ branch: 1, semester: 1, section: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Class.countDocuments(),
    ]);

    return sendSuccess(
      res,
      { classes },
      "Classes fetched successfully",
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
    return sendError(res, "Failed to fetch classes", 500, [error.message]);
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isMongoObjectId(id)) {
      return sendError(res, "Invalid class id", 400);
    }

    const classDoc = await Class.findById(id).lean();
    if (!classDoc) {
      return sendError(res, "Class not found", 404);
    }

    const [studentCount, assignmentCount, timetableCount] = await Promise.all([
      Student.countDocuments(buildStudentMatchForClass(classDoc)),
      TeachingAssignment.countDocuments({ classId: classDoc._id }),
      Timetable.countDocuments({ classId: classDoc._id }),
    ]);

    if (studentCount || assignmentCount || timetableCount) {
      return sendError(res, "Class is in use and cannot be deleted", 409, [
        `students=${studentCount}`,
        `teachingAssignments=${assignmentCount}`,
        `timetableSlots=${timetableCount}`,
      ]);
    }

    await Class.deleteOne({ _id: classDoc._id });

    await logActivity({
      action: "Class deleted",
      actionType: "CLASS_DELETED",
      performedBy: req.user.userId,
      entity: { type: "Class", id: classDoc._id, name: classDoc.className },
    });

    return sendSuccess(res, { id }, "Class deleted successfully");
  } catch (error) {
    return sendError(res, "Failed to delete class", 500, [error.message]);
  }
};

export const createTimetableSlot = async (req, res) => {
  try {
    const { classId, subjectId, staffId, day, startTime, endTime } = req.body;

    const errors = [];
    if (!isMongoObjectId(classId)) errors.push("classId must be a valid ObjectId");
    if (!isMongoObjectId(subjectId)) errors.push("subjectId must be a valid ObjectId");
    if (!isMongoObjectId(staffId)) errors.push("staffId must be a valid ObjectId");
    if (!dayOptions.includes(day)) errors.push("day must be a valid weekday");
    if (!isValidTimeString(startTime)) errors.push("startTime must be in HH:mm format");
    if (!isValidTimeString(endTime)) errors.push("endTime must be in HH:mm format");

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);

    if (endMinutes <= startMinutes) {
      return sendError(res, "endTime must be after startTime", 400);
    }

    const [classDoc, subject, staff] = await Promise.all([
      Class.findById(classId).lean(),
      Subject.findById(subjectId).lean(),
      Staff.findById(staffId).lean(),
    ]);

    if (!classDoc) return sendError(res, "Class not found", 404);
    if (!subject) return sendError(res, "Subject not found", 404);
    if (!staff) return sendError(res, "Staff not found", 404);

    if (subject.branch !== classDoc.branch || subject.semester !== classDoc.semester) {
      return sendError(res, "Subject does not belong to the class branch/semester", 400);
    }

    const existingSlots = await Timetable.find({ classId: classDoc._id, day }).lean();
    const conflict = existingSlots.find((slot) => {
      const slotStart = toMinutes(slot.startTime);
      const slotEnd = toMinutes(slot.endTime);
      return startMinutes < slotEnd && endMinutes > slotStart;
    });

    if (conflict) {
      return sendError(res, "Timetable slot overlaps with an existing entry", 409, [
        `conflict=${conflict.startTime}-${conflict.endTime}`,
      ]);
    }

    const slot = await Timetable.create({
      classId: classDoc._id,
      subjectId: subject._id,
      staffId: staff._id,
      day,
      startTime,
      endTime,
    });

    const populated = await Timetable.findById(slot._id)
      .populate("classId", "_id className branch semester section")
      .populate("subjectId", "_id name code")
      .populate({ path: "staffId", populate: { path: "userId", select: "name email" }, select: "userId department" })
      .lean();

    await logActivity({
      action: "Timetable slot assigned",
      actionType: "TIMETABLE_ASSIGNED",
      performedBy: req.user.userId,
      entity: { type: "Timetable", id: slot._id, name: `${classDoc.className} ${day}` },
      metadata: { classId: classDoc._id, subjectId: subject._id, staffId: staff._id, day, startTime, endTime },
    });

    return sendSuccess(res, { slot: populated }, "Timetable slot created successfully", 201);
  } catch (error) {
    return sendError(res, "Failed to create timetable slot", 500, [error.message]);
  }
};

export const getTimetable = async (req, res) => {
  try {
    const { classId } = req.query;
    if (!isMongoObjectId(classId)) {
      return sendError(res, "classId query parameter is required", 400);
    }

    const classDoc = await Class.findById(classId).lean();
    if (!classDoc) {
      return sendError(res, "Class not found", 404);
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 200)));
    const skip = (page - 1) * limit;

    const rows = await Timetable.find({ classId: classDoc._id })
      .populate("classId", "_id className branch semester section")
      .populate("subjectId", "_id name code")
      .populate({ path: "staffId", populate: { path: "userId", select: "name email" }, select: "userId department" })
      .lean();

    const sorted = rows.sort((a, b) => {
      const dayDiff = dayOptions.indexOf(a.day) - dayOptions.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return String(a.startTime).localeCompare(String(b.startTime));
    });

    const total = sorted.length;
    const paged = sorted.slice(skip, skip + limit);

    return sendSuccess(
      res,
      { timetable: paged, class: classDoc },
      "Timetable fetched successfully",
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
    return sendError(res, "Failed to fetch timetable", 500, [error.message]);
  }
};

export const getSettings = async (_req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return sendSuccess(res, { settings }, "Settings fetched successfully");
  } catch (error) {
    return sendError(res, "Failed to fetch settings", 500, [error.message]);
  }
};

export const updateSettings = async (req, res) => {
  try {
    const {
      systemName,
      academicYear,
      allowRegistration,
      defaultRole,
      notifySmsEnabled,
      notifyEmailEnabled,
      notifyMarksEnabled,
    } = req.body;

    const errors = [];
    if (systemName !== undefined && !isNonEmptyString(systemName)) errors.push("systemName must be a valid string");
    if (academicYear !== undefined && !isNonEmptyString(academicYear)) errors.push("academicYear must be a valid string");
    if (allowRegistration !== undefined && typeof allowRegistration !== "boolean") errors.push("allowRegistration must be boolean");
    if (notifySmsEnabled !== undefined && typeof notifySmsEnabled !== "boolean") errors.push("notifySmsEnabled must be boolean");
    if (notifyEmailEnabled !== undefined && typeof notifyEmailEnabled !== "boolean") errors.push("notifyEmailEnabled must be boolean");
    if (notifyMarksEnabled !== undefined && typeof notifyMarksEnabled !== "boolean") errors.push("notifyMarksEnabled must be boolean");
    if (defaultRole !== undefined && !allowedRoles.includes(defaultRole)) errors.push("defaultRole must be a valid role");

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    const updates = {};
    if (systemName !== undefined) updates.systemName = toTrimmed(systemName);
    if (academicYear !== undefined) updates.academicYear = toTrimmed(academicYear);
    if (allowRegistration !== undefined) updates.allowRegistration = allowRegistration;
    if (defaultRole !== undefined) updates.defaultRole = defaultRole;
    if (notifySmsEnabled !== undefined) updates.notifySmsEnabled = notifySmsEnabled;
    if (notifyEmailEnabled !== undefined) updates.notifyEmailEnabled = notifyEmailEnabled;
    if (notifyMarksEnabled !== undefined) updates.notifyMarksEnabled = notifyMarksEnabled;

    let settings = await Settings.findOne({ singleton: "default" });
    if (!settings) {
      settings = await Settings.create({
        systemName: updates.systemName || "CampusFlow",
        academicYear: updates.academicYear || buildDefaultAcademicYear(),
        allowRegistration: updates.allowRegistration ?? true,
        defaultRole: updates.defaultRole || "student",
        notifySmsEnabled: updates.notifySmsEnabled ?? true,
        notifyEmailEnabled: updates.notifyEmailEnabled ?? true,
        notifyMarksEnabled: updates.notifyMarksEnabled ?? true,
      });
    } else {
      settings.set(updates);
      await settings.save();
    }

    return sendSuccess(res, { settings }, "Settings updated successfully");
  } catch (error) {
    return sendError(res, "Failed to update settings", 500, [error.message]);
  }
};

export const getStaffProfiles = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    const skip = (page - 1) * limit;

    const [staff, total] = await Promise.all([
      Staff.find()
        .populate("userId", "name email role")
        .populate("subjectsAssigned", "_id name code branch semester")
        .select("_id userId department subjectsAssigned")
        .skip(skip)
        .limit(limit)
        .lean(),
      Staff.countDocuments(),
    ]);

    return sendSuccess(
      res,
      { staff },
      "Staff fetched successfully",
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
    return sendError(res, "Failed to fetch staff", 500, [error.message]);
  }
};

export const getSubjects = async (req, res) => {
  try {
    const { page = 1, limit = 20, semester, branch } = req.query;

    if (semester !== undefined && semester !== "" && !inRange(semester, 1, 8)) {
      return sendError(res, "semester must be 1-8", 400);
    }

    const normalizedPage = Math.max(1, Number(page || 1));
    const normalizedLimit = Math.min(100, Math.max(1, Number(limit || 20)));

    const filter = {};
    if (semester) filter.semester = Number(semester);
    if (branch) filter.branch = branch;

    const subjects = await Subject.find(filter)
      .sort({ createdAt: -1 })
      .select("_id name code branch semester")
      .skip((normalizedPage - 1) * normalizedLimit)
      .limit(normalizedLimit)
      .lean();

    const total = await Subject.countDocuments(filter);
    const subjectIds = subjects.map((subject) => subject._id);

    const [studentCounts, assignments] = await Promise.all([
      subjectIds.length
        ? Student.aggregate([
            { $match: { assignedSubjects: { $in: subjectIds } } },
            { $unwind: "$assignedSubjects" },
            { $match: { assignedSubjects: { $in: subjectIds } } },
            { $group: { _id: "$assignedSubjects", count: { $sum: 1 } } },
          ])
        : [],
      subjectIds.length
        ? TeachingAssignment.find({ subjectId: { $in: subjectIds } })
            .populate({ path: "staffId", populate: { path: "userId", select: "name email role" }, select: "userId department" })
            .select("subjectId classId staffId")
            .lean()
        : [],
    ]);

    const countMap = new Map(studentCounts.map((item) => [String(item._id), item.count]));
    const assignmentMap = new Map();

    for (const assignment of assignments) {
      const key = String(assignment.subjectId);
      if (!assignmentMap.has(key)) {
        assignmentMap.set(key, { classIds: new Set(), staffMap: new Map() });
      }
      const entry = assignmentMap.get(key);
      if (assignment.classId) entry.classIds.add(String(assignment.classId));
      if (assignment.staffId) entry.staffMap.set(String(assignment.staffId._id || assignment.staffId), assignment.staffId);
    }

    const enriched = subjects.map((subject) => {
      const assignmentInfo = assignmentMap.get(String(subject._id));
      const staffList = assignmentInfo ? Array.from(assignmentInfo.staffMap.values()) : [];
      const classCount = assignmentInfo ? assignmentInfo.classIds.size : 0;

      return {
        ...subject,
        studentsCount: countMap.get(String(subject._id)) || 0,
        assignedStaff: staffList,
        assignedClassesCount: classCount,
      };
    });

    return res.json({
      success: true,
      subjects: enriched,
      total,
    });
  } catch (err) {
    console.error("ADMIN SUBJECT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subjects",
    });
  }
};

export const getAdminDashboard = async (_req, res) => {
  try {
    const [
      totalStaffCount,
      totalSubjectCount,
      classesRaw,
      activityFeedRaw,
      teachingRowsRaw,
      studentRowsRaw,
      attendanceRowsRaw,
      marksRowsRaw,
      assignmentRowsRaw,
      timetableRowsRaw,
    ] = await Promise.all([
      Staff.countDocuments(),
      Subject.countDocuments(),
      Class.find().sort({ branch: 1, semester: 1, section: 1 }).lean(),
      ActivityLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("performedBy", "name role")
        .lean(),
      TeachingAssignment.aggregate([{ $group: { _id: "$classId", count: { $sum: 1 } } }]),
      Student.aggregate([
        { $match: { classId: { $ne: null } } },
        { $group: { _id: "$classId", count: { $sum: 1 } } },
      ]),
      Attendance.aggregate([{ $group: { _id: "$classId", count: { $sum: 1 } } }]),
      Marks.aggregate([{ $group: { _id: "$classId", count: { $sum: 1 } } }]),
      Assignment.aggregate([{ $group: { _id: "$classId", count: { $sum: 1 } } }]),
      Timetable.aggregate([{ $group: { _id: "$classId", count: { $sum: 1 } } }]),
    ]);

    const totalStaff = Number.isFinite(totalStaffCount) ? totalStaffCount : 0;
    const totalSubjects = Number.isFinite(totalSubjectCount) ? totalSubjectCount : 0;
    const classes = Array.isArray(classesRaw) ? classesRaw : [];
    const activityFeedRows = Array.isArray(activityFeedRaw) ? activityFeedRaw : [];
    const teachingRows = Array.isArray(teachingRowsRaw) ? teachingRowsRaw : [];
    const studentRows = Array.isArray(studentRowsRaw) ? studentRowsRaw : [];
    const attendanceRows = Array.isArray(attendanceRowsRaw) ? attendanceRowsRaw : [];
    const marksRows = Array.isArray(marksRowsRaw) ? marksRowsRaw : [];
    const assignmentRows = Array.isArray(assignmentRowsRaw) ? assignmentRowsRaw : [];
    const timetableRows = Array.isArray(timetableRowsRaw) ? timetableRowsRaw : [];

    const teachingMap = mapCountsByClass(teachingRows);
    const studentMap = mapCountsByClass(studentRows);
    const attendanceMap = mapCountsByClass(attendanceRows);
    const marksMap = mapCountsByClass(marksRows);
    const assignmentMap = mapCountsByClass(assignmentRows);
    const timetableMap = mapCountsByClass(timetableRows);

    const systemHealthClasses = classes
      .map((classDoc) => {
        const classId = String(classDoc._id);
        const className = classDoc.className || formatClassName(classDoc.branch, classDoc.semester, classDoc.section);
        const teachingCount = teachingMap.get(classId) || 0;
        const studentsCount = studentMap.get(classId) || 0;
        const attendanceCount = attendanceMap.get(classId) || 0;
        const marksCount = marksMap.get(classId) || 0;
        const assignmentCount = assignmentMap.get(classId) || 0;
        const timetableCount = timetableMap.get(classId) || 0;
        const hasTeachingAssignments = teachingCount > 0;
        const hasStudents = studentsCount > 0;
        const hasAttendance = attendanceCount > 0;
        const hasMarks = marksCount > 0;
        const hasAssignments = assignmentCount > 0;
        const hasTimetable = timetableCount > 0;

        const issues = [];
        if (!hasTeachingAssignments) issues.push({ level: "critical", message: "Class not configured" });
        if (!hasAttendance) issues.push({ level: "warning", message: "No attendance data" });
        if (!hasMarks) issues.push({ level: "warning", message: "No marks data" });
        if (!hasAssignments) issues.push({ level: "info", message: "No assignments" });
        if (!hasTimetable) issues.push({ level: "info", message: "No timetable" });
        if (!hasStudents) issues.push({ level: "info", message: "No students" });

        const status = issues.some((issue) => issue.level === "critical")
          ? "critical"
          : issues.some((issue) => issue.level === "warning")
            ? "warning"
            : issues.some((issue) => issue.level === "info")
              ? "info"
              : "healthy";

        return {
          classId: classDoc._id,
          className,
          counts: {
            teaching: teachingCount,
            students: studentsCount,
            attendance: attendanceCount,
            marks: marksCount,
            assignments: assignmentCount,
            timetable: timetableCount,
          },
          health: {
            hasTeachingAssignments,
            hasStudents,
            hasAttendance,
            hasMarks,
            hasAssignments,
            hasTimetable,
          },
          status,
          issues: issues.map((issue) => issue.message),
        };
      })
      .sort((a, b) => {
        const rank = { critical: 0, warning: 1, info: 2, healthy: 3 };
        const statusDiff = rank[a.status] - rank[b.status];
        if (statusDiff !== 0) return statusDiff;
        return String(a.className).localeCompare(String(b.className));
      });

    const summary = systemHealthClasses.reduce(
      (acc, item) => {
        acc.totalClasses += 1;
        if (item.status === "critical") acc.misconfiguredCount += 1;
        if (item.status === "warning") acc.warningCount += 1;
        if (item.status === "info") acc.infoCount += 1;
        if (item.status === "healthy") acc.healthyCount += 1;
        acc.issueCount += item.issues.length;
        return acc;
      },
      { totalClasses: 0, misconfiguredCount: 0, warningCount: 0, infoCount: 0, healthyCount: 0, issueCount: 0 }
    );

    const mostProblematic = systemHealthClasses.reduce((acc, item) => {
      if (!acc || item.issues.length > acc.issueCount) {
        return { classId: item.classId, className: item.className, issueCount: item.issues.length };
      }
      return acc;
    }, null);

    const consistencyWarning = systemHealthClasses.some((item) => {
      const studentsCount = item.counts?.students || 0;
      if (!studentsCount) return false;
      const attendanceCount = item.counts?.attendance || 0;
      const marksCount = item.counts?.marks || 0;
      if (attendanceCount < studentsCount) return true;
      if (marksCount < studentsCount) return true;
      return false;
    });

    const dateKey = new Date().toISOString().slice(0, 10);
    await SystemHealthSnapshot.findOneAndUpdate(
      { dateKey },
      {
        dateKey,
        totalClasses: summary.totalClasses,
        healthyCount: summary.healthyCount,
        misconfiguredCount: summary.misconfiguredCount,
        warningCount: summary.warningCount,
        infoCount: summary.infoCount,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const trendRowsRaw = await SystemHealthSnapshot.find().sort({ dateKey: -1 }).limit(7).lean();
    const trendRows = Array.isArray(trendRowsRaw) ? trendRowsRaw : [];
    const healthTrend = trendRows
      .map((row) => {
        const label = new Date(row.dateKey).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return {
          dateKey: row.dateKey,
          label,
          healthy: row.healthyCount || 0,
          misconfigured: row.misconfiguredCount || 0,
        };
      })
      .sort((a, b) => String(a.dateKey).localeCompare(String(b.dateKey)));

    const statsSummary = {
      totalStaff,
      totalSubjects,
      totalClasses: classes.length,
    };

    const stats = [
      { key: "totalStaff", label: "Total Staff", value: totalStaff },
      { key: "totalSubjects", label: "Total Subjects", value: totalSubjects },
      { key: "totalClasses", label: "Total Classes", value: classes.length },
    ];

    const recentActivity = activityFeedRows.map((log) => ({
      id: log._id,
      action: log.action,
      performedBy: log.performedBy?.name || "System",
      role: log.performedBy?.role || "admin",
      entity: log.entity,
      time: log.createdAt,
    }));

    return sendSuccess(
      res,
      {
        stats,
        statsSummary,
        health: systemHealthClasses,
        recentActivity,
        systemHealth: {
          summary,
          classes: systemHealthClasses,
          consistencyWarning,
          mostProblematic,
          healthTrend,
        },
        activityFeed: recentActivity,
      },
      "Admin dashboard fetched successfully"
    );
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      data: {
        stats: [],
        statsSummary: { totalStaff: 0, totalSubjects: 0, totalClasses: 0 },
        health: [],
        recentActivity: [],
        systemHealth: {
          summary: {
            totalClasses: 0,
            misconfiguredCount: 0,
            warningCount: 0,
            infoCount: 0,
            healthyCount: 0,
            issueCount: 0,
          },
          classes: [],
          consistencyWarning: false,
          mostProblematic: null,
          healthTrend: [],
        },
        activityFeed: [],
      },
    });
  }
};

