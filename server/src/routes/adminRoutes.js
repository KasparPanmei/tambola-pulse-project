import { Router } from "express";

import {
    getAdminDashboard,
    getAdminTickets,
    generateAdminTickets,
    getAdminBookings,
    getAdminPayments,
    getAdminRoom,
    createRoom,
} from "../controllers/adminController.js";

import {
    resetRoom,
    startRoom,
    pauseRoom,
    terminateRoom,
    drawRoomBall,
} from "../controllers/roomController.js";

import {
    getAdminClaims,
    verifyClaim,
    rejectClaim,
} from "../controllers/ClaimController.js";

import {
    requireAuth,
} from "../utils/auth.js";

import {
    requireAdmin,
} from "../utils/adminAuth.js";

const router = Router();

router.use(
    requireAuth,
    requireAdmin
);

// Dashboard
router.get(
    "/dashboard",
    getAdminDashboard
);

// Rooms
router.get(
    "/rooms/:roomCode",
    getAdminRoom
);

router.post(
    "/rooms",
    createRoom
);

router.post(
    "/rooms/:roomCode/start",
    startRoom
);

router.post(
    "/rooms/:roomCode/pause",
    pauseRoom
);

router.post(
    "/rooms/:roomCode/terminate",
    terminateRoom
);

router.post(
    "/rooms/:roomCode/reset",
    resetRoom
);

router.post(
    "/rooms/:roomCode/draw",
    drawRoomBall
);

// Tickets
router.get(
    "/tickets",
    getAdminTickets
);

router.post(
    "/tickets/generate",
    generateAdminTickets
);

// Bookings
router.get(
    "/bookings",
    getAdminBookings
);

// Payments
router.get(
    "/payments",
    getAdminPayments
);

// Prize claims
router.get(
    "/rooms/:roomCode/claims",
    getAdminClaims
);

router.post(
    "/claims/:claimId/verify",
    verifyClaim
);

router.post(
    "/claims/:claimId/reject",
    rejectClaim
);

export default router;