import { Router } from "express";
import { getParentDashboard } from "../controllers/parentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authMiddleware, roleMiddleware("parent"));
router.get("/dashboard", getParentDashboard);

export default router;
