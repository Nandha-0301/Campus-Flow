import { verifyFirebaseToken } from "../config/firebaseAdmin.js";
import User from "../models/User.js";
import { sendError } from "../utils/response.js";

export const verifyFirebaseTokenMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Authorization token is required", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyFirebaseToken(token);

    req.auth = {
      firebaseUID: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || null,
    };

    return next();
  } catch (_error) {
    return sendError(res, "Invalid or expired Firebase token", 401);
  }
};

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Authorization token is required", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyFirebaseToken(token);

    const user = await User.findOne({ firebaseUID: decoded.uid });
    if (!user) {
      return sendError(res, "Authenticated user is not registered in CampusFlow", 404);
    }

    if (user.isActive === false) {
      return sendError(res, "Account deactivated", 403);
    }

    req.user = {
      userId: user._id,
      _id: user._id,
      firebaseUID: decoded.uid,
      email: decoded.email,
      role: user.role,
      name: user.name,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
    };
    req.auth = {
      firebaseUID: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || null,
    };

    return next();
  } catch (_error) {
    return sendError(res, "Invalid or expired Firebase token", 401);
  }
};
