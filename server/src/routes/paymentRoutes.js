import { Router } from "express";
import {
    razorpayWebhook,
} from "../controllers/bookingController.js";

const router = Router();

router.post(
    "/razorpay",
    razorpayWebhook,
);

export default router;