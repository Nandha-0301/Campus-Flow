export const sendSuccess = (res, data, message = "OK", status = 200, meta = undefined) => {
  const payload = { success: true, message, data };
  if (meta !== undefined) payload.meta = meta;
  return res.status(status).json(payload);
};

export const sendError = (res, message = "Request failed", status = 500, errors = undefined) => {
  const payload = { success: false, message };
  if (errors !== undefined) payload.errors = errors;
  return res.status(status).json(payload);
};
