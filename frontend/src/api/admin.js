import api from "./axios";

const unwrap = (response) => {
  const payload = response.data;
  if (payload && typeof payload === "object" && "success" in payload) {
    return payload.data;
  }
  return payload;
};

const unwrapWithMeta = (response) => {
  const payload = response.data;
  if (payload && typeof payload === "object" && "success" in payload) {
    return { data: payload.data, meta: payload.meta };
  }
  return { data: payload, meta: undefined };
};

const get = async (url, config) => unwrap(await api.get(url, config));
const getWithMeta = async (url, config) => unwrapWithMeta(await api.get(url, config));
const post = async (url, payload, config) => unwrap(await api.post(url, payload, config));
const patch = async (url, payload, config) => unwrap(await api.patch(url, payload, config));
const remove = async (url, config) => unwrap(await api.delete(url, config));

export const getAdminDashboard = async () => get("/admin/dashboard");
export const getAdminSettings = async () => get("/admin/settings");
export const updateAdminSettings = async (payload) => patch("/admin/settings", payload);

export const getAdminStaff = async () => get("/admin/staff");
export const createStaff = async (payload) => post("/admin/staff", payload);
export const deleteStaff = async (id) => remove(`/admin/staff/${id}`);

export const getAdminAnnouncements = async (params = {}) => get("/admin/announcements", { params });
export const createAnnouncement = async (payload) => post("/admin/announcements", payload);
export const updateAnnouncement = async (id, payload) => patch(`/admin/announcements/${id}`, payload);
export const deleteAnnouncement = async (id) => remove(`/admin/announcements/${id}`);

export const getAdminSubjects = async (params = {}) => {
  const response = await api.get("/admin/subjects", { params });
  return response.data;
};

export const getAdminSubjectsWithMeta = async (params = {}) => {
  const response = await api.get("/admin/subjects", { params });
  const subjects = response.data?.subjects || [];
  const total = response.data?.total ?? 0;
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 20);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    data: { subjects },
    meta: { pagination: { page, limit, total, totalPages } },
  };
};

export const createSubject = async (payload) => post("/admin/create-subject", payload);
export const updateSubject = async (id, payload) => patch(`/admin/subject/${id}`, payload);
export const deleteSubject = async (id) => remove(`/admin/subject/${id}`);

export const assignTeaching = async (payload) => post("/admin/assign-teaching", payload);

export const getAdminClasses = async () => get("/admin/classes");
export const getAdminClassesWithMeta = async (params = {}) => getWithMeta("/admin/classes", { params });
export const createClass = async (payload) => post("/admin/classes", payload);
export const deleteClass = async (id) => remove(`/admin/classes/${id}`);

export const getAdminTimetable = async (classId) => get("/admin/timetable", { params: { classId } });
export const getAdminTimetableWithMeta = async (params = {}) => getWithMeta("/admin/timetable", { params });
export const createTimetableSlot = async (payload) => post("/admin/timetable", payload);
