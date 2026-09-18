import { Router } from "express";

import {
    holdTickets,
    createBooking,
    getBookingStatus,
    verifyBookingPayment,
    joinRoom,
} from "../controllers/bookingController.js";

import { requireAuth } from "../utils/auth.js";

const r = Router();

r.use(requireAuth);

r.post(
    "/hold",
    holdTickets,
);

r.post(
    "/",
    createBooking,
);

r.get(
    "/:reference/status",
    getBookingStatus,
);

r.post(
    "/:reference/verify-payment",
    verifyBookingPayment,
);

r.post(
    "/join-room",
    joinRoom
);
export default r;