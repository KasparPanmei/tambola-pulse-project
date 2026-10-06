import Room from "../models/Room.js";
import Ticket from "../models/Ticket.js";
import Booking from "../models/Booking.js";
import { generateTicket } from "../utils/tickets.js";


export async function getAdminDashboard(req, res) {
    try {
        const room = await Room.findOne({
            code: process.env.ADMIN_ROOM_CODE || "TAM-8842",
        });

        if (!room) {
            return res.status(404).json({
                message: "Room not found",
            });
        }

        const [
            totalTickets,
            availableTickets,
            bookedTickets,
            heldTickets,
            totalBookings,
            revenueResult,
        ] = await Promise.all([
            Ticket.countDocuments({
                room: room._id,
            }),

            Ticket.countDocuments({
                room: room._id,
                status: "available",
            }),

            Ticket.countDocuments({
                room: room._id,
                status: "booked",
            }),

            Ticket.countDocuments({
                room: room._id,
                status: "held",
            }),

            Booking.countDocuments({
                room: room._id,
            }),

            Booking.aggregate([
                {
                    $match: {
                        room: room._id,
                        paymentStatus: "paid",
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $ifNull: ["$total", 0],
                            },
                        },
                    },
                },
            ]),
        ]);

        res.json({
            room,
            stats: {
                totalTickets,
                availableTickets,
                bookedTickets,
                heldTickets,
                totalBookings,
                revenue:
                    revenueResult[0]?.total || 0,
            },
        });
    } catch (error) {
        console.error(
            "Admin dashboard error:",
            error,
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to load admin dashboard",
        });
    }
}
export async function createRoom(req, res) {
    try {
        const {
            code,
            title,
            description,
            startsAt,
            ticketPrice,
            jackpot,
            balls,
            prizes,
        } = req.body;

        if (!code || !title) {
            return res.status(400).json({
                message:
                    "Room code and title are required",
            });
        }

        const normalizedCode =
            code.trim().toUpperCase();

        const existingRoom =
            await Room.findOne({
                code: normalizedCode,
            });

        if (existingRoom) {
            return res.status(409).json({
                message:
                    "A room with this code already exists",
            });
        }

        const normalizedPrizes =
            Array.isArray(prizes)
                ? prizes
                    .map((prize, index) => ({
                        id:
                            prize?.id ||
                            [
                                "early-five",
                                "top-line",
                                "middle-line",
                                "bottom-line",
                                "four-corners",
                                "full-house",
                            ][index] ||
                            `prize-${index + 1}`,

                        name:
                            prize?.name ||
                            `Prize ${index + 1}`,

                        shortName:
                            prize?.shortName ||
                            prize?.name ||
                            `Prize ${index + 1}`,

                        amount:
                            Number(
                                prize?.amount ??
                                prize?.prizeAmount ??
                                0,
                            ),

                        reward:
                            typeof prize?.reward ===
                                "string"
                                ? prize.reward
                                : `₹${Number(
                                    prize?.amount ??
                                    prize?.prizeAmount ??
                                    0,
                                ).toLocaleString(
                                    "en-IN",
                                )}`,

                        detail:
                            prize?.detail ||
                            prize?.description ||
                            "Complete the required pattern",

                        accent:
                            prize?.accent ||
                            [
                                "coral",
                                "gold",
                                "mint",
                                "lilac",
                            ][index % 4],

                        // CHANGED: Automatic room claims are deliberately limited to one winning ticket per prize.
                        winners: 1,

                        enabled:
                            prize?.enabled !== false,
                    }))
                : [];

        const room =
            await Room.create({
                code: normalizedCode,

                title: title.trim(),

                description:
                    description?.trim() || "",

                status: "upcoming",

                startsAt: startsAt
                    ? new Date(startsAt)
                    : new Date(),

                ticketPrice:
                    Number(ticketPrice) || 0,

                jackpot:
                    Number(jackpot) || 0,

                balls:
                    Number(balls) || 90,

                prizes:
                    normalizedPrizes,
            });

        return res.status(201).json({
            message:
                "Room created successfully",

            room,
        });
    } catch (error) {
        console.error(
            "Create room error:",
            error,
        );

        return res.status(500).json({
            message:
                error.message ||
                "Unable to create room",
        });
    }
}

export async function getAdminTickets(req, res) {
    try {
        const roomCode =
            req.query.room ||
            process.env.ADMIN_ROOM_CODE ||
            "TAM-8842";

        const room = await Room.findOne({
            code: roomCode,
        });

        if (!room) {
            return res.status(404).json({
                message: "Room not found",
            });
        }

        const tickets = await Ticket.find({
            room: room._id,
        })
            .sort({ number: 1 })
            .select(
                "number publicCode grid status heldUntil booking",
            );

        res.json({
            room,
            tickets,
        });
    } catch (error) {
        console.error(
            "Get admin tickets error:",
            error,
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to load tickets",
        });
    }
}



export async function generateAdminTickets(
    req,
    res,
) {
    try {
        const roomCode =
            req.body.roomCode ||
            process.env.ADMIN_ROOM_CODE ||
            "TAM-8842";

        const requestedCount = Number(
            req.body.count,
        );

        if (
            !Number.isInteger(requestedCount) ||
            requestedCount < 1 ||
            requestedCount > 1000
        ) {
            return res.status(400).json({
                message:
                    "Ticket count must be between 1 and 1000",
            });
        }

        const room = await Room.findOne({
            code: roomCode,
        });

        if (!room) {
            return res.status(404).json({
                message: "Room not found",
            });
        }

        const existingCount =
            await Ticket.countDocuments({
                room: room._id,
            });

        const documents = [];

        for (
            let i = 0;
            i < requestedCount;
            i++
        ) {
            const number =
                existingCount + i + 1;

            documents.push({
                room: room._id,
                number,
                publicCode:
                    `${room.code}-${String(
                        number,
                    ).padStart(2, "0")}`,
                grid: generateTicket(),
                status: "available",
            });
        }

        const created =
            await Ticket.insertMany(
                documents,
                {
                    ordered: true,
                },
            );

        res.status(201).json({
            message: `${created.length} tickets generated successfully`,
            count: created.length,
            tickets: created,
        });
    } catch (error) {
        console.error(
            "Generate admin tickets error:",
            error,
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to generate tickets",
        });
    }
}


export async function getAdminBookings(
    req,
    res,
) {
    try {
        const roomCode =
            req.query.room ||
            process.env.ADMIN_ROOM_CODE ||
            "TAM-8842";

        const room = await Room.findOne({
            code: roomCode,
        });

        if (!room) {
            return res.status(404).json({
                message: "Room not found",
            });
        }

        const bookings =
            await Booking.find({
                room: room._id,
            })
                .populate(
                    "user",
                    "name phone",
                )
                .populate(
                    "tickets",
                    "number publicCode status",
                )
                .sort({ createdAt: -1 });

        res.json({
            bookings,
        });
    } catch (error) {
        console.error(
            "Get admin bookings error:",
            error,
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to load bookings",
        });
    }
}


export async function getAdminPayments(req, res) {
    try {
        const roomCode =
            req.query.room ||
            process.env.ADMIN_ROOM_CODE ||
            "TAM-8842";

        const room = await Room.findOne({
            code: roomCode,
        });

        if (!room) {
            return res.status(404).json({
                message: "Room not found",
            });
        }

        const payments = await Booking.find({
            room: room._id,
        })
            .populate(
                "user",
                "name phone",
            )
            .populate(
                "tickets",
                "number publicCode status",
            )
            .select(
                "reference amount fee total paymentMethod paymentStatus status razorpayPaymentId upiReference createdAt updatedAt user tickets",
            )
            .sort({
                createdAt: -1,
            });

        res.json({
            payments,
        });
    } catch (error) {
        console.error(
            "Get admin payments error:",
            error,
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to load payment history",
        });
    }
}

export async function getAdminRoom(
    req,
    res,
) {
    try {
        const room =
            await Room.findOne({
                code: req.params.roomCode,
            });

        if (!room) {
            return res.status(404).json({
                message: "Room not found",
            });
        }

        const ticketStats =
            await Ticket.aggregate([
                {
                    $match: {
                        room: room._id,
                    },
                },
                {
                    $group: {
                        _id: "$status",
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]);

        res.json({
            room,
            ticketStats,
        });
    } catch (error) {
        console.error(
            "Get admin room error:",
            error,
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to load room",
        });
    }
}

export async function resetRoom(
    req,
    res,
) {
    try {
        const room =
            await Room.findOne({
                code: req.params.roomCode,
            });

        if (!room) {
            return res.status(404).json({
                message: "Room not found",
            });
        }

        await Ticket.updateMany(
            {
                room: room._id,
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

        room.status = "upcoming";

        await room.save();

        res.json({
            message: "Room reset successfully",
            room,
        });
    } catch (error) {
        console.error(
            "Reset room error:",
            error,
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to reset room",
        });
    }
}


export async function startRoom(
    req,
    res,
) {
    try {
        const room =
            await Room.findOne({
                code: req.params.roomCode,
            });

        if (!room) {
            return res.status(404).json({
                message: "Room not found",
            });
        }

        room.status = "live";

        if (!room.startsAt) {
            room.startsAt = new Date();
        }

        await room.save();

        res.json({
            message: "Game started",
            room,
        });
    } catch (error) {
        console.error(
            "Start room error:",
            error,
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to start game",
        });
    }
}


export async function pauseRoom(
    req,
    res,
) {
    try {
        const room =
            await Room.findOne({
                code: req.params.roomCode,
            });

        if (!room) {
            return res.status(404).json({
                message: "Room not found",
            });
        }

        room.status = "upcoming";

        await room.save();

        res.json({
            message: "Game paused",
            room,
        });
    } catch (error) {
        console.error(
            "Pause room error:",
            error,
        );

        res.status(500).json({
            message:
                error.message ||
                "Failed to pause game",
        });
    }
}


export async function terminateRoom(
    req,
    res,
) {
    try {
        // CHANGED: Mark the terminated room and every historical room closed before any later homepage active-room lookup.
        const room =
            await Room.findOne({
                code: req.params.roomCode,
            });

        if (!room) {
            return res.status(404).json({
                message: "Room not found",
            });
        }

        // CHANGED: Close all stored rooms so an older public-status record cannot reappear on the homepage.
        await Room.updateMany(
            {},
            {
                $set: {
                    status: "closed",
                    autoCaller: false,
                },
            },
        );

        room.status = "closed";
        await room.save();

        // CHANGED: Do not let a client cache the termination response or its previous room state.
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

        res.json({
            message: "Game terminated",
            room,
        });
    } catch (error) {
        console.error(
            "Terminate room error:",
            error,
        );

        res.status(500).json({
            message:
                "Failed to terminate game",
        });
    }
}
