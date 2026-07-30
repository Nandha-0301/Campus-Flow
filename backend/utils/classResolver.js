import Class from "../models/Class.js";
import { isMongoObjectId, isNonEmptyString, toTrimmed } from "./validators.js";

export const formatClassName = (branch, semester, section) => {
  const normalizedBranch = toTrimmed(branch).toUpperCase();
  const normalizedSection = toTrimmed(section).toUpperCase();
  return `${normalizedBranch}-${Number(semester)}-${normalizedSection}`;
};

export const normalizeClassPayload = (branch, semester, section) => ({
  branch: toTrimmed(branch),
  semester: Number(semester),
  section: toTrimmed(section),
});

export const getClassById = async (classId) => {
  if (!isMongoObjectId(classId)) return null;
  return Class.findById(classId).lean();
};

export const getClassByDetails = async (branch, semester, section) => {
  if (!isNonEmptyString(branch) || !isNonEmptyString(section)) return null;
  const normalizedSemester = Number(semester);
  if (normalizedSemester < 1 || normalizedSemester > 8) return null;
  const normalized = normalizeClassPayload(branch, normalizedSemester, section);
  return Class.findOne(normalized).lean();
};

export const resolveClassForStudent = async (student) => {
  if (!student) return null;
  if (student.classId) {
    const found = await getClassById(student.classId);
    if (found) return found;
  }
  return getClassByDetails(student.branch, student.semester, student.section);
};

export const buildStudentMatchForClass = (classDoc) => ({
  $or: [
    { classId: classDoc._id },
    {
      classId: null,
      branch: classDoc.branch,
      semester: classDoc.semester,
      section: classDoc.section,
    },
  ],
});

export const buildSubjectMatchForClass = (classDoc) => ({
  branch: classDoc.branch,
  semester: classDoc.semester,
});
