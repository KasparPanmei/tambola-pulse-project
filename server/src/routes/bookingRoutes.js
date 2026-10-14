import { Router } from "express";

import {
    holdTickets,
    createBooking,
    getBookingStatus,
    submitManualPayment,
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
    "/:reference/submit-manual-payment",
    submitManualPayment,
);


r.post(
    "/join-room",
    joinRoom
);
export default r;