import { Router } from "express";

import {
    getAdminDashboard,
    getAdminTickets,
    generateAdminTickets,
    getAdminBookings,
    getAdminPayments,
    getAdminRoom,
    resetRoom,
    startRoom,
    pauseRoom,
    terminateRoom,
    createRoom,
} from "../controllers/adminController.js";

import { requireAuth } from "../utils/auth.js";
import { requireAdmin } from "../utils/adminAuth.js";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/dashboard", getAdminDashboard);

router.get("/tickets", getAdminTickets);

router.post(
    "/tickets/generate",
    generateAdminTickets,
);
router.post("/rooms", createRoom);
router.get("/rooms/:roomCode", getAdminRoom);
router.get("/bookings", getAdminBookings);
router.get("/payments", getAdminPayments);
router.get(
    "/rooms/:roomCode",
    getAdminRoom,
);

router.post(
    "/rooms/:roomCode/reset",
    resetRoom,
);

router.post(
    "/rooms/:roomCode/start",
    startRoom,
);

router.post(
    "/rooms/:roomCode/pause",
    pauseRoom,
);

router.post(
    "/rooms/:roomCode/terminate",
    terminateRoom,
);


export default router;