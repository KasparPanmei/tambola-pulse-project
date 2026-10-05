import { Router } from "express";

import {
    getActiveRoom,
    getRoom,
    getPlayerRoomState,
} from "../controllers/roomController.js";

// CHANGED: Player claim submission was removed; winning tickets are claimed automatically by the draw engine.
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

export default router;