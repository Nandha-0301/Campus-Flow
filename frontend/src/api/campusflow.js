import api, { getAuthHeaderForUser } from "./axios";

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

const withFirebaseUserConfig = async (config = {}, firebaseUser = null, forceRefresh = false) => {
  if (!firebaseUser) {
    return config;
  }

  const authHeaders = await getAuthHeaderForUser(firebaseUser, forceRefresh);
  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      ...authHeaders,
    },
    skipAuthRetry: true,
  };
};

const get = async (url, config) => unwrap(await api.get(url, config));
const getWithMeta = async (url, config) => unwrapWithMeta(await api.get(url, config));
const post = async (url, payload, config) => unwrap(await api.post(url, payload, config));
const put = async (url, payload, config) => unwrap(await api.put(url, payload, config));
const del = async (url, config) => unwrap(await api.delete(url, config));
const patch = async (url, payload, config) => unwrap(await api.patch(url, payload, config));

export const getMe = async (firebaseUser = null, { forceRefresh = false } = {}) =>
  get("/auth/me", await withFirebaseUserConfig({}, firebaseUser, forceRefresh));

export const getPublicSettings = async () => get("/auth/settings");

export const validateRoleSelection = async (selectedRole, firebaseUser = null, { forceRefresh = false } = {}) =>
  post(
    "/auth/validate-role",
    { selectedRole },
    await withFirebaseUserConfig({}, firebaseUser, forceRefresh)
  );

export const registerUser = async (payload, firebaseUser = null, { forceRefresh = false } = {}) =>
  post("/auth/register", payload, await withFirebaseUserConfig({}, firebaseUser, forceRefresh));

export const getSubjects = async () => {
  const response = await api.get("/subjects");
  return response;
};

export const getStudentDashboard = async () => get("/student/dashboard");
export const getStudentMarks = async () => get("/student/marks");
export const getStudentAttendance = async () => get("/student/attendance");

export const getParentDashboard = async () => get("/parent/dashboard");

export const getStaffDashboard = async () => get("/staff/dashboard");
export const getStaffAssignments = async () => get("/staff/assignments");
export const getStaffClasses = async () => get("/staff/classes");
export const getStaffTimetable = async () => get("/staff/timetable");
export const getStaffClassStudents = async (classId) => get(`/staff/class/${classId}/students`);
export const getStaffStudents = async (subjectId) => get("/staff/students", { params: { subjectId } });
export const getStaffAttendance = async (params) => get("/staff/attendance", { params });
export const getStaffMarks = async (params) => get("/staff/marks", { params });
export const saveAttendance = async (payload) => post("/attendance", payload);
export const saveMarks = async (payload) => post("/marks", payload);
export const createAssignment = async (payload) => post("/staff/assignment", payload);
export const getAcademicAssignments = async (params) => get("/staff/academic-assignments", { params });
export const createAcademicAssignment = async (payload) => post("/staff/academic-assignments", payload);
export const updateAcademicAssignment = async (id, payload) => put(`/staff/academic-assignments/${id}`, payload);
export const deleteAcademicAssignment = async (id) => del(`/staff/academic-assignments/${id}`);
export const getAcademicAssignmentSubmissions = async (id) => get(`/staff/academic-assignments/${id}/submissions`);
export const saveAcademicAssignmentMarks = async (id, payload) => post(`/staff/academic-assignments/${id}/marks`, payload);
export const createStaffAnnouncement = async (payload) => post("/staff/announcements", payload);

export const getNotices = async ({ limit = 10, page = 1, type } = {}) => get("/notices", { params: { limit, page, type } });
export const getAnnouncements = async () => get("/announcements");

export const getExams = async ({ upcoming = true, page = 1, limit = 20 } = {}) =>
  get("/exams", { params: { upcoming, page, limit } });

export const createNotice = async (payload) => post("/notices", payload);
export const createExam = async (payload) => post("/exams", payload);

export { getWithMeta, patch, put, del };
