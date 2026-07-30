import { Router } from "express";
import { createExam, createNotice, getAssignments, getExams, getNotices, getSubjects } from "../controllers/commonController.js";
import { getAnnouncements } from "../controllers/announcementController.js";
import { recordAttendance, recordMarks } from "../controllers/staffController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authMiddleware);
router.get("/notices", getNotices);
router.get("/subjects", getSubjects);
router.get("/announcements", getAnnouncements);
router.get("/assignments", getAssignments);
router.get("/exams", getExams);
router.post("/notices", roleMiddleware("admin", "staff"), createNotice);
router.post("/exams", roleMiddleware("admin", "staff"), createExam);
router.post("/attendance", roleMiddleware("staff"), recordAttendance);
router.post("/marks", roleMiddleware("staff"), recordMarks);

export default router;