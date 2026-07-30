import Announcement from "../models/Announcement.js";
import ActivityLog from "../models/ActivityLog.js";
import Class from "../models/Class.js";
import Staff from "../models/Staff.js";
import Student from "../models/Student.js";
import TeachingAssignment from "../models/TeachingAssignment.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { isMongoObjectId, isNonEmptyString, toTrimmed } from "../utils/validators.js";

const allowedTypes = ["HOLIDAY", "EXAM", "INTERNAL", "EVENT", "GENERAL"];
const allowedTargets = ["STUDENTS", "PARENTS"];

const logAnnouncementActivity = async ({ action, performedBy, entity }) => {
  try {
    await ActivityLog.create({
      action,
      actionType: "ANNOUNCEMENT",
      performedBy,
      entity,
    });
  } catch (error) {
    console.error("ActivityLog error:", error);
  }
};
export const createAnnouncement = async (req, res) => {
  try {
    const { title, description, type, target, classId, isActive = true } = req.body;

    const errors = [];
    if (!isNonEmptyString(title)) errors.push("title is required");
    if (!isNonEmptyString(description)) errors.push("description is required");
    if (!allowedTypes.includes(type)) errors.push("type must be HOLIDAY/EXAM/INTERNAL/EVENT/GENERAL");
    if (!allowedTargets.includes(target)) errors.push("target must be STUDENTS/PARENTS");

    const normalizedClassId = classId ? String(classId) : "";
    if (normalizedClassId && !isMongoObjectId(normalizedClassId)) {
      errors.push("classId must be a valid ObjectId");
    }

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    if (normalizedClassId) {
      const classExists = await Class.findById(normalizedClassId).lean();
      if (!classExists) {
        return sendError(res, "Class not found", 404);
      }
    }

    const announcement = await Announcement.create({
      title: toTrimmed(title),
      description: toTrimmed(description),
      type,
      target,
      classId: normalizedClassId || null,
      createdBy: req.user.userId,
      isActive: Boolean(isActive),
    });

    await logAnnouncementActivity({
      action: "Announcement created",
      performedBy: req.user.userId,
      entity: { type: "Announcement", id: announcement._id, name: announcement.title },
    });

    return sendSuccess(res, { announcement }, "Announcement created", 201);
  } catch (error) {
    return sendError(res, "Failed to create announcement", 500, [error.message]);
  }
};

export const getAdminAnnouncements = async (req, res) => {
  try {
    const { type, target } = req.query;
    const filter = {};
    if (type && allowedTypes.includes(type)) filter.type = type;
    if (target && allowedTargets.includes(target)) filter.target = target;

    const announcements = await Announcement.find(filter)
      .sort({ createdAt: -1 })
      .populate("classId", "className branch semester section")
      .lean();

    return sendSuccess(res, { announcements }, "Announcements fetched");
  } catch (error) {
    return sendError(res, "Failed to fetch announcements", 500, [error.message]);
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isMongoObjectId(id)) {
      return sendError(res, "Invalid announcement id", 400);
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return sendError(res, "Announcement not found", 404);
    }

    const { title, description, type, target, classId, isActive } = req.body;

    const errors = [];
    if (title !== undefined && !isNonEmptyString(title)) errors.push("title must be valid");
    if (description !== undefined && !isNonEmptyString(description)) errors.push("description must be valid");
    if (type !== undefined && !allowedTypes.includes(type)) errors.push("type must be HOLIDAY/EXAM/INTERNAL/EVENT/GENERAL");
    if (target !== undefined && !allowedTargets.includes(target)) errors.push("target must be STUDENTS/PARENTS");

    let normalizedClassId = announcement.classId ? String(announcement.classId) : "";
    if (classId !== undefined) {
      normalizedClassId = classId ? String(classId) : "";
      if (normalizedClassId && !isMongoObjectId(normalizedClassId)) {
        errors.push("classId must be a valid ObjectId");
      } else if (normalizedClassId) {
        const classExists = await Class.findById(normalizedClassId).lean();
        if (!classExists) errors.push("classId is invalid");
      }
    }

    if (errors.length) {
      return sendError(res, "Validation failed", 400, errors);
    }

    if (title !== undefined) announcement.title = toTrimmed(title);
    if (description !== undefined) announcement.description = toTrimmed(description);
    if (type !== undefined) announcement.type = type;
    if (target !== undefined) announcement.target = target;
    if (classId !== undefined) announcement.classId = normalizedClassId || null;
    if (typeof isActive === "boolean") announcement.isActive = isActive;

    await announcement.save();

    await logAnnouncementActivity({
      action: "Announcement updated",
      performedBy: req.user.userId,
      entity: { type: "Announcement", id: announcement._id, name: announcement.title },
    });

    return sendSuccess(res, { announcement }, "Announcement updated");
  } catch (error) {
    return sendError(res, "Failed to update announcement", 500, [error.message]);
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isMongoObjectId(id)) {
      return sendError(res, "Invalid announcement id", 400);
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return sendError(res, "Announcement not found", 404);
    }

    await Announcement.deleteOne({ _id: announcement._id });

    await logAnnouncementActivity({
      action: "Announcement deleted",
      performedBy: req.user.userId,
      entity: { type: "Announcement", id: announcement._id, name: announcement.title },
    });

    return sendSuccess(res, { id: announcement._id }, "Announcement deleted");
  } catch (error) {
    return sendError(res, "Failed to delete announcement", 500, [error.message]);
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const role = req.user?.role;
    const baseFilter = { isActive: true };
    const orFilters = [];

    if (role === "student") {
      const student = await Student.findOne({ userId: req.user.userId }).lean();
      if (!student) {
        return sendError(res, "Student profile not found", 404);
      }
      if (student.classId) {
        orFilters.push(
          { target: "STUDENTS", classId: student.classId },
          { target: "STUDENTS", classId: null },
          { target: "STUDENTS", classId: { $exists: false } }
        );
      } else {
        orFilters.push(
          { target: "STUDENTS", classId: null },
          { target: "STUDENTS", classId: { $exists: false } }
        );
      }
    } else if (role === "parent") {
      orFilters.push(
        { target: "PARENTS", classId: null },
        { target: "PARENTS", classId: { $exists: false } }
      );
    } else if (role === "staff") {
      const staff = await Staff.findOne({ userId: req.user.userId }).lean();
      if (!staff) {
        return sendError(res, "Staff profile not found", 404);
      }
      const classIds = await TeachingAssignment.find({ staffId: staff._id }).distinct("classId");
      if (classIds.length) {
        orFilters.push(
          { target: "STUDENTS", classId: { $in: classIds } },
          { target: "PARENTS", classId: { $in: classIds } }
        );
      }
    } else if (role === "admin") {
      orFilters.push({ target: "STUDENTS" }, { target: "PARENTS" });
    }

    const announcements = orFilters.length
      ? await Announcement.find({
          ...baseFilter,
          $or: orFilters,
        })
          .sort({ createdAt: -1 })
          .populate("classId", "className branch semester section")
          .lean()
      : [];

    return sendSuccess(res, { announcements }, "Announcements fetched");
  } catch (error) {
    return sendError(res, "Failed to fetch announcements", 500, [error.message]);
  }
};


