import { Router } from "express";
import { requestOtp, verifyOtp } from "../controllers/authController.js";
const r = Router();
r.post("/request-otp", requestOtp);
r.post("/verify-otp", verifyOtp);
export default r;
