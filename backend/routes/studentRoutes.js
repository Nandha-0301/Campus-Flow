import { Router } from "express";
import {
  getStudentAttendance,
  getStudentDashboard,
  getStudentMarks,
} from "../controllers/studentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authMiddleware, roleMiddleware("student"));
router.get("/dashboard", getStudentDashboard);
router.get("/marks", getStudentMarks);
router.get("/attendance", getStudentAttendance);

export default router;
