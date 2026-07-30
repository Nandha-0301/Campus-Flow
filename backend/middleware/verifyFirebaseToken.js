import { verifyFirebaseToken as verifyFirebaseTokenWithAdmin } from "../config/firebaseAdmin.js";
import User from "../models/User.js";
import { sendError } from "../utils/response.js";

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return sendError(res, "Authorization token is required", 401);
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyFirebaseTokenWithAdmin(token);

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
    return sendError(res, "Invalid or expired Firebase token", 401, [error.message]);
  }
};

export default verifyFirebaseToken;
