import { Router } from "express";
import {
  assignTeaching,
  createClass,
  createStaff,
  createSubject,
  createTimetableSlot,
  deleteClass,
  deleteStaff,
  deleteSubject,
  getAdminDashboard,
  getClasses,
  getSettings,
  getStaffProfiles,
  getSubjects,
  getTimetable,
  updateSettings,
  updateSubject,
} from "../controllers/adminController.js";
import { createAnnouncement, deleteAnnouncement, getAdminAnnouncements, updateAnnouncement } from "../controllers/announcementController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authMiddleware, roleMiddleware("admin"));
router.get("/dashboard", getAdminDashboard);
router.get("/settings", getSettings);
router.patch("/settings", updateSettings);

router.post("/staff", createStaff);
router.get("/staff", getStaffProfiles);
router.delete("/staff/:id", deleteStaff);

router.post("/create-subject", createSubject);
router.patch("/subject/:id", updateSubject);
router.delete("/subject/:id", deleteSubject);

router.post("/assign-teaching", assignTeaching);

router.post("/announcements", createAnnouncement);
router.get("/announcements", getAdminAnnouncements);
router.patch("/announcements/:id", updateAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

router.post("/classes", createClass);
router.get("/classes", getClasses);
router.delete("/classes/:id", deleteClass);

router.post("/timetable", createTimetableSlot);
router.get("/timetable", getTimetable);

router.get("/subjects", getSubjects);

export default router;
