import Room from "../models/Room.js";
import Ticket from "../models/Ticket.js";
import Booking from "../models/Booking.js";
import PrizeClaim from "../models/PrizeClaim.js";

import { drawNextBall } from "../utils/gameEngine.js";



export async function getActiveRoom(req, res) {
    try {
        const room = await Room.findOne({
            status: {
                $in: [
                    "upcoming",
                    "live",
                    "paused",
                ],
            },
        }).sort({
            startsAt: 1,
            createdAt: -1,
        });

        if (!room) {
            return res.status(404).json({
                message:
                    "No active game room found",
            });
        }

        const tickets = await Ticket.find({
            room: room._id,
            status: "available",
        })
            .sort({
                number: 1,
            })
            .select(
                "_id number publicCode grid status",
            );

        return res.json({
            room,
            tickets,
        });
    } catch (error) {
        console.error(
            "Get active room error:",
            error,
        );

        return res.status(500).json({
            message:
                "Unable to load active game room",
        });
    }
}



export async function getRoom(req, res) {
    try {
        const code = req.params.code
            ?.trim()
            .toUpperCase();

        if (!code) {
            return res.status(400).json({
                message:
                    "Room code is required",
            });
        }

        const room =
            await Room.findOne({
                code,
            });

        if (!room) {
            return res.status(404).json({
                message:
                    `Room ${code} not found`,
            });
        }

        const tickets =
            await Ticket.find({
                room: room._id,
                status: "available",
            })
                .sort({
                    number: 1,
                })
                .select(
                    "_id number publicCode grid status",
                );

        return res.json({
            room,
            tickets,
        });
    } catch (error) {
        console.error(
            "Get room error:",
            error,
        );

        return res.status(500).json({
            message:
                "Unable to load game room",
            error: error.message,
        });
    }
}


export async function startRoom(req, res) {
    try {
        const code = req.params.roomCode
            ?.trim()
            .toUpperCase();

        if (!code) {
            return res.status(400).json({
                message:
                    "Room code is required",
            });
        }

        const room =
            await Room.findOne({
                code,
            });

        if (!room) {
            return res.status(404).json({
                message:
                    `Room ${code} not found`,
            });
        }

        const isResume =
            room.status === "paused";

        room.status = "live";

        room.autoCaller = true;

        if (!isResume) {
            room.currentNumber = null;

            room.calledNumbers = [];

            room.gameStartedAt =
                new Date();

            room.gameVersion += 1;
        }

        room.lastCalledAt =
            new Date();

        await room.save();

        return res.json({
            message: isResume
                ? "Game resumed"
                : "Game started",

            room,
        });
    } catch (error) {
        console.error(
            "Start room error:",
            error,
        );

        return res.status(500).json({
            message:
                "Unable to start game",

            error: error.message,
        });
    }
}
export async function pauseRoom(req, res) {
    try {
        const code = req.params.roomCode
            ?.trim()
            .toUpperCase();

        const room =
            await Room.findOne({
                code,
            });

        if (!room) {
            return res.status(404).json({
                message:
                    `Room ${code} not found`,
            });
        }

        room.status = "paused";
        room.autoCaller = false;

        await room.save();

        return res.json({
            message: "Game paused",
            room,
        });
    } catch (error) {
        console.error(
            "Pause room error:",
            error,
        );

        return res.status(500).json({
            message:
                "Unable to pause game",
        });
    }
}


export async function terminateRoom(
    req,
    res,
) {
    try {
        const code = req.params.roomCode
            ?.trim()
            .toUpperCase();

        const room =
            await Room.findOne({
                code,
            });

        if (!room) {
            return res.status(404).json({
                message:
                    `Room ${code} not found`,
            });
        }

        room.status = "closed";

        room.autoCaller = false;

        await room.save();

        return res.json({
            message:
                "Game terminated",

            room,
        });
    } catch (error) {
        console.error(
            "Terminate room error:",
            error,
        );

        return res.status(500).json({
            message:
                "Unable to terminate game",
        });
    }
}
async function release() {
    await Ticket.updateMany(
        {
            status: "held",
            booking: null,
            heldUntil: { $lte: new Date() },
        },
        {
            $set: {
                status: "available",
                heldUntil: null,
                heldBy: null,
                booking: null,
            },
        },
    );
}
export async function resetRoom(req, res) {
    try {
        const code = req.params.roomCode
            ?.trim()
            .toUpperCase();

        const room =
            await Room.findOne({
                code,
            });

        if (!room) {
            return res.status(404).json({
                message:
                    `Room ${code} not found`,
            });
        }


        room.status = "upcoming";

        room.currentNumber = null;

        room.calledNumbers = [];

        room.autoCaller = false;

        room.gameStartedAt = null;

        room.lastCalledAt = null;

        room.gameVersion += 1;

        await room.save();

        await PrizeClaim.deleteMany({
            room: room._id,
        });

        return res.json({
            message:
                "Room reset successfully",

            room,
        });
    } catch (error) {
        console.error(
            "Reset room error:",
            error,
        );

        return res.status(500).json({
            message:
                "Unable to reset room",
        });
    }
}
export async function drawRoomBall(
    req,
    res,
) {
    try {
        const code = req.params.roomCode
            ?.trim()
            .toUpperCase();

        if (!code) {
            return res.status(400).json({
                message:
                    "Room code is required",
            });
        }

        const room =
            await drawNextBall(code);

        return res.json({
            message:
                `Ball ${room.currentNumber} called`,

            room,

            currentNumber:
                room.currentNumber,

            calledNumbers:
                room.calledNumbers,
        });
    } catch (error) {
        console.error(
            "Draw ball error:",
            error,
        );

        return res.status(400).json({
            message:
                error.message,
        });
    }
}

export async function getPlayerRoomState(
    req,
    res,
) {
    try {
        const code = req.params.code
            ?.trim()
            .toUpperCase();

        const room =
            await Room.findOne({
                code,
            });

        if (!room) {
            return res.status(404).json({
                message:
                    "Room not found",
            });
        }

        const userId =
            req.auth.sub;

        /*
         * Make sure this player actually
         * owns a confirmed paid booking
         * for this room.
         */
        const booking =
            await Booking.findOne({
                room: room._id,

                user: userId,

                paymentStatus: "paid",

                status: "confirmed",
            });

        if (!booking) {
            return res.status(403).json({
                message:
                    "You do not have access to this room",
            });
        }

        /*
         * Only verified winners are visible
         * to players.
         */
        const winners =
            await PrizeClaim.find({
                room: room._id,

                status: "verified",
            })
                .sort({
                    verifiedAt: -1,
                })
                .populate(
                    "user",
                    "name",
                )
                .populate(
                    "ticket",
                    "_id number publicCode",
                );

        /*
         * Player's own claims.
         */
        const myClaims =
            await PrizeClaim.find({
                room: room._id,

                user: userId,
            })
                .select(
                    "prizeId prizeName prizeAmount status ticket claimedAt verifiedAt",
                );

        return res.json({
            room: {
                _id: room._id,

                code: room.code,

                title: room.title,

                description:
                    room.description,

                status: room.status,

                startsAt:
                    room.startsAt,

                ticketPrice:
                    room.ticketPrice,

                jackpot:
                    room.jackpot,

                balls:
                    room.balls,

                currentNumber:
                    room.currentNumber,

                calledNumbers:
                    room.calledNumbers,

                callCadence:
                    room.callCadence,

                autoCaller:
                    room.autoCaller,

                gameStartedAt:
                    room.gameStartedAt,

                lastCalledAt:
                    room.lastCalledAt,

                gameVersion:
                    room.gameVersion,

                prizes:
                    room.prizes || [],
            },

            prizes:
                room.prizes || [],

            winners:
                winners.map(
                    (claim) => ({
                        id: claim._id,

                        prizeId:
                            claim.prizeId,

                        prizeName:
                            claim.prizeName,

                        prizeAmount:
                            claim.prizeAmount,

                        userName:
                            claim.user?.name ||
                            "Player",

                        ticketId:
                            claim.ticket
                                ?.publicCode ||
                            claim.ticket?._id,

                        ticketNumber:
                            claim.ticket
                                ?.number,

                        verifiedAt:
                            claim.verifiedAt,
                    }),
                ),

            myClaims:
                myClaims.map(
                    (claim) => ({
                        id: claim._id,

                        prizeId:
                            claim.prizeId,

                        prizeName:
                            claim.prizeName,

                        prizeAmount:
                            claim.prizeAmount,

                        status:
                            claim.status,

                        ticket:
                            claim.ticket,

                        claimedAt:
                            claim.claimedAt,

                        verifiedAt:
                            claim.verifiedAt,
                    }),
                ),
        });
    } catch (error) {
        console.error(
            "Get player room state error:",
            error,
        );

        return res.status(500).json({
            message:
                "Unable to load room state",
        });
    }
}