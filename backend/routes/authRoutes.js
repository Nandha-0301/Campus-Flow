import { Router } from "express";
import { getMe, getPublicSettings, registerUser, validateSelectedRole } from "../controllers/authController.js";
import verifyFirebaseToken from "../middleware/verifyFirebaseToken.js";

const router = Router();

router.get("/settings", getPublicSettings);

router.get("/me", verifyFirebaseToken, getMe);
router.post("/register", verifyFirebaseToken, registerUser);
router.post("/validate-role", verifyFirebaseToken, validateSelectedRole);

export default router;
