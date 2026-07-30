import Staff from "../models/Staff.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import Settings from "../models/Settings.js";
import { sendError, sendSuccess } from "../utils/response.js";

const ALLOWED_ROLES = ["admin", "staff", "student", "parent"];

const roleHome = {
  admin: "/admin",
  staff: "/staff",
  student: "/student",
  parent: "/parent",
};

const generateFallbackUsn = () => `CF-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

const buildStudentDefaults = (payload, semesterNumber) => ({
  usn: payload.usn || generateFallbackUsn(),
  branch: payload.branch || "GENERAL",
  semester: semesterNumber,
  section: payload.section || "A",
});

const resolveDisplayName = ({ providedName, tokenName, email }) => {
  const trimmedProvided = providedName?.trim();
  if (trimmedProvided) return trimmedProvided;

  const trimmedTokenName = tokenName?.trim();
  if (trimmedTokenName) return trimmedTokenName;

  const localPart = email?.split("@")[0]?.trim();
  if (localPart) return localPart;

  return "CampusFlow User";
};

const isDuplicateKeyError = (error) => error?.code === 11000;

export const getMe = async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return sendError(res, "Invalid or expired Firebase token", 401);
    }

    const user = await User.findOne({ firebaseUID: uid }).select("_id firebaseUID name email role permissions createdAt").lean();

    if (!user) {
      return sendSuccess(res, { user: null, profile: null }, "User not registered");
    }

    let profile = null;

    if (user.role === "student") {
      profile = await Student.findOne({ userId: user._id })
        .select("_id usn branch semester section parentId assignedSubjects")
        .populate("parentId", "_id name email role")
        .populate("assignedSubjects", "_id name code branch semester")
        .lean();
    } else if (user.role === "staff") {
      profile = await Staff.findOne({ userId: user._id })
        .select("_id department subjectsAssigned")
        .populate("subjectsAssigned", "_id name code branch semester")
        .lean();
    }

    return sendSuccess(res, { user, profile }, "Profile fetched successfully");
  } catch (error) {
    console.error("getMe error:", error);
    return sendError(res, "Server error", 500, [error.message]);
  }
};

export const registerUser = async (req, res) => {
  try {
    const uid = req.user?.uid;
    const tokenEmail = req.user?.email;
    const tokenName = req.user?.name;

    if (!uid) {
      return sendError(res, "Invalid or expired Firebase token", 401);
    }

    const settings = await Settings.findOne({ singleton: "default" }).select("allowRegistration").lean();
    if (settings && settings.allowRegistration === false) {
      return sendError(res, "Registration is currently disabled", 403);
    }

    const { role } = req.body;
    if (!role) {
      return sendError(res, "Role is required", 400);
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return sendError(res, "role must be one of admin, staff, student, parent", 400);
    }

    let studentSemester = null;
    if (role === "student") {
      const semesterProvided = req.body.semester !== undefined && req.body.semester !== null && req.body.semester !== "";
      const semesterNumber = Number(req.body.semester);
      if (!Number.isInteger(semesterNumber) || semesterNumber < 1 || semesterNumber > 8) {
        if (!semesterProvided) {
          studentSemester = 1;
        } else {
          return sendError(res, "semester must be 1-8", 400);
        }
      } else {
        studentSemester = semesterNumber;
      }
    }

    const normalizedEmail = (tokenEmail || req.body.email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      return sendError(res, "Email not available in token", 400);
    }

    const existingUser = await User.findOne({ firebaseUID: uid }).lean();
    if (existingUser) {
      return sendSuccess(res, { user: existingUser, redirectPath: roleHome[existingUser.role] || "/" }, "User already registered");
    }

    const existingByEmail = await User.findOne({ email: normalizedEmail }).lean();
    if (existingByEmail) {
      return sendError(res, "Email already linked with another account", 409);
    }

    const newUser = await User.create({
      firebaseUID: uid,
      email: normalizedEmail,
      role,
      name: resolveDisplayName({ providedName: req.body.name, tokenName, email: normalizedEmail }),
    });

    let profile = null;

    try {
      if (role === "student") {
        const studentDefaults = buildStudentDefaults(req.body, studentSemester);
        profile = await Student.create({
          userId: newUser._id,
          usn: studentDefaults.usn,
          branch: studentDefaults.branch,
          semester: studentDefaults.semester,
          section: studentDefaults.section,
        });
      }

      if (role === "staff") {
        profile = await Staff.create({
          userId: newUser._id,
          department: req.body.department || "GENERAL",
        });
      }
    } catch (profileError) {
      try {
        await User.deleteOne({ _id: newUser._id });
      } catch (cleanupError) {
        console.error("registerUser cleanup error:", cleanupError);
      }
      throw profileError;
    }

    return sendSuccess(res, { user: newUser, profile, redirectPath: roleHome[role] || "/" }, "User registered successfully", 201);
  } catch (error) {
    console.error("registerUser error:", error);

    if (isDuplicateKeyError(error)) {
      return sendError(res, "User already exists", 409);
    }

    if (error?.name === "ValidationError") {
      return sendError(res, "Invalid registration payload", 400, [error.message]);
    }

    return sendError(res, "Server error", 500, [error.message]);
  }
};

export const validateSelectedRole = async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return sendError(res, "Invalid or expired Firebase token", 401);
    }

    const settings = await Settings.findOne({ singleton: "default" }).select("allowRegistration").lean();
    if (settings && settings.allowRegistration === false) {
      return sendError(res, "Registration is currently disabled", 403);
    }

    const { selectedRole } = req.body;
    if (!selectedRole) {
      return sendError(res, "selectedRole is required", 400);
    }

    const user = await User.findOne({ firebaseUID: uid }).select("role").lean();
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    if (user.role !== selectedRole) {
      return sendError(res, "Selected role does not match account role", 403, [
        `accountRole=${user.role}`,
        `selectedRole=${selectedRole}`,
      ]);
    }

    return sendSuccess(res, { role: user.role, redirectPath: roleHome[user.role] || "/" }, "Role validated");
  } catch (error) {
    return sendError(res, "Failed to validate selected role", 500, [error.message]);
  }
};

export const getPublicSettings = async (_req, res) => {
  try {
    const settings = await Settings.findOne({ singleton: "default" })
      .select("systemName academicYear allowRegistration defaultRole")
      .lean();

    const fallback = {
      systemName: "CampusFlow",
      academicYear: "",
      allowRegistration: true,
      defaultRole: "student",
    };

    return sendSuccess(res, { settings: settings || fallback }, "Settings fetched successfully");
  } catch (error) {
    return sendError(res, "Failed to fetch settings", 500, [error.message]);
  }
};



