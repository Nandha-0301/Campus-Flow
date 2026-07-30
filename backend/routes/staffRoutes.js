import { Router } from "express";
import {
  createAssignment,
  createStaffAnnouncement,
  deleteAcademicAssignment,
  getAcademicAssignmentSubmissions,
  getAcademicAssignments,
  getStaffAssignments,
  getStaffAttendance,
  getStaffClasses,
  getStaffClassStudents,
  getStaffDashboard,
  getStaffTimetable,
  getStaffMarks,
  saveAcademicAssignmentMarks,
  updateAcademicAssignment,
  getStudentsForStaff,
  recordAttendance,
  recordMarks,
} from "../controllers/staffController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authMiddleware, roleMiddleware("staff"));
router.get("/dashboard", getStaffDashboard);
router.get("/assignments", getStaffAssignments);
router.get("/classes", getStaffClasses);
router.get("/timetable", getStaffTimetable);
router.get("/class/:classId/students", getStaffClassStudents);
router.get("/students", getStudentsForStaff);
router.get("/attendance", getStaffAttendance);
router.get("/marks", getStaffMarks);
router.get("/academic-assignments", getAcademicAssignments);
router.post("/academic-assignments", createAssignment);
router.put("/academic-assignments/:assignmentId", updateAcademicAssignment);
router.delete("/academic-assignments/:assignmentId", deleteAcademicAssignment);
router.get("/academic-assignments/:assignmentId/submissions", getAcademicAssignmentSubmissions);
router.post("/academic-assignments/:assignmentId/marks", saveAcademicAssignmentMarks);
router.post("/attendance", recordAttendance);
router.post("/attendance/bulk", recordAttendance);
router.post("/marks", recordMarks);
router.post("/marks/bulk", recordMarks);
router.post("/assignment", createAssignment);
router.post("/announcements", createStaffAnnouncement);

export default router;