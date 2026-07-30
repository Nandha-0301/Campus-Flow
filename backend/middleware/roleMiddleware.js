import { sendError } from "../utils/response.js";

export const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Unauthorized", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, "You do not have access to this resource", 403);
    }

    return next();
  };
};
