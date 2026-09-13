import { Router } from "express";

import {
    getRoom,
    getActiveRoom,
} from "../controllers/roomController.js";

const router = Router();

router.get("/active", getActiveRoom);
router.get("/:code", getRoom);

export default router;