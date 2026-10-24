import { Router } from "express";
import { requestOtp, verifyOtp, logoutAdmin } from "../controllers/authController.js";
import { requireAuth } from "../utils/auth.js";

const r = Router();
r.post("/request-otp", requestOtp);
r.post("/verify-otp", verifyOtp);
r.post("/admin/logout", requireAuth, logoutAdmin);

export default r;
