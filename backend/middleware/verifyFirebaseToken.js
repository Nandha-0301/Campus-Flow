import { verifyFirebaseToken as verifyFirebaseTokenWithAdmin } from "../config/firebaseAdmin.js";
import User from "../models/User.js";
import { sendError } from "../utils/response.js";

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      console.warn("Auth middleware: missing Bearer Authorization header", { path: req.path });
      return sendError(res, "Authorization token is required", 401);
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      console.warn("Auth middleware: empty Bearer token", { path: req.path });
      return sendError(res, "Authorization token is required", 401);
    }

    const decodedToken = await verifyFirebaseTokenWithAdmin(token);

    console.info("Auth middleware: token verified", {
      path: req.path,
      uid: decodedToken.uid,
      aud: decodedToken.aud || null,
    });

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      name: decodedToken.name || null,
    };

    const existingUser = await User.findOne({ firebaseUID: decodedToken.uid }).select("isActive").lean();
    if (existingUser && existingUser.isActive === false) {
      return sendError(res, "Account deactivated", 403);
    }

    return next();
  } catch (error) {
    console.warn("Auth middleware: token rejected", {
      path: req.path,
      code: error?.code || "unknown",
      message: error?.message || "Invalid Firebase token",
    });
    return sendError(res, "Invalid or expired Firebase token", 401, [error?.message || "Invalid Firebase token"]);
  }
};

export default verifyFirebaseToken;
