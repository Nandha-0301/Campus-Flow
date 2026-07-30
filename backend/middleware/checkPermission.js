import { sendError } from "../utils/response.js";

export const checkPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Unauthorized", 401);
    }

    if (req.user.role === "admin") {
      return next();
    }

    const permissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    const hasAll = requiredPermissions.every((permission) => permissions.includes(permission));

    if (!hasAll) {
      return sendError(res, "Insufficient permissions", 403);
    }

    return next();
  };
};
