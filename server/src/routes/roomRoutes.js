import { Router } from "express";

import {
    getActiveRoom,
    getRoom,
    getPlayerRoomState,
} from "../controllers/roomController.js";

import {
    submitClaim,
} from "../controllers/ClaimController.js";

import {
    requireAuth,
} from "../utils/auth.js";

const router = Router();

router.get(
    "/active",
    getActiveRoom
);

router.get(
    "/:code",
    getRoom
);

router.get(
    "/:code/state",
    requireAuth,
    getPlayerRoomState
);

router.post(
    "/:code/claims",
    requireAuth,
    submitClaim
);

export default router;