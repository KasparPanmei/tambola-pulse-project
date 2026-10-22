import Room from "../models/Room.js";
import Ticket from "../models/Ticket.js";
import Booking from "../models/Booking.js";
import PrizeClaim from "../models/PrizeClaim.js";
// CHANGED: Generate complete six-ticket sheets instead of standalone tickets.
import { generateTicketStrip } from "../utils/tickets.js";

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
            message: "Failed to load admin dashboard",
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
        } = req.body || {};

        if (typeof code !== "string" || typeof title !== "string" || !code.trim() || !title.trim()) {
            return res.status(400).json({
                message:
                    "Room code and title are required",
            });
        }

        const normalizedCode = code.trim().toUpperCase();
        if (!/^[A-Z0-9-]{3,20}$/.test(normalizedCode)) {
            return res.status(400).json({ message: "Room code must be 3–20 letters, numbers, or hyphens." });
        }
        if (title.trim().length > 120 || String(description || "").trim().length > 500) {
            return res.status(400).json({ message: "Room title or description is too long." });
        }
        const priceValue = Number(ticketPrice);
        const jackpotValue = Number(jackpot ?? 0);
        const ballValue = Number(balls ?? 90);
        if (!Number.isFinite(priceValue) || priceValue <= 0) {
            return res.status(400).json({ message: "Ticket price must be a positive number." });
        }
        if (!Number.isFinite(jackpotValue) || jackpotValue < 0) {
            return res.status(400).json({ message: "Jackpot must be a non-negative number." });
        }
        if (ballValue !== 90) {
            return res.status(400).json({ message: "Tambola rooms must use exactly 90 balls." });
        }
        if (startsAt && !Number.isFinite(new Date(startsAt).getTime())) {
            return res.status(400).json({ message: "Start time is invalid." });
        }
        if (prizes !== undefined && !Array.isArray(prizes)) {
            return res.status(400).json({ message: "Prizes must be a list." });
        }
        if ((prizes || []).length > 20 || (prizes || []).some((prize) => {
            const amount = Number(prize?.amount ?? prize?.prizeAmount ?? 0);
            return !Number.isFinite(amount) || amount < 0 || String(prize?.name || "").length > 120;
        })) {
            return res.status(400).json({ message: "Prize details are invalid." });
        }

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
                                // ADDED: Include the sheet-level prize ID in the default prize ID order.
                                "sheet-prize",
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

                ticketPrice: priceValue,

                jackpot: jackpotValue,

                balls: ballValue,

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
            message: "Unable to create room",
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
            message: "Failed to load tickets",
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

        // CHANGED: Accept any requested ticket count; only the final strip may be partial.
        if (
            !Number.isInteger(requestedCount) ||
            requestedCount < 1 ||
            requestedCount > 1000
        ) {
            return res.status(400).json({
                message:
                    "Ticket count must be between 1 and 1000.",
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

        // CHANGED: Reject repeated 15-number ticket layouts, including against
        // tickets already generated for this room.
        const existingTickets = await Ticket.find({ room: room._id }).select("grid sheetId sheetNumber").lean();
        const ticketSignatures = new Set(existingTickets.map(({ grid }) => JSON.stringify(grid)));
        const existingSheetIds = new Set(existingTickets.map(({ sheetId }) => sheetId).filter(Boolean));
        const documents = [];

        // CHANGED: Generate valid six-ticket strips, then keep exactly the
        // requested number of tickets (the last strip can be partial).
        for (let offset = 0; offset < requestedCount; offset += 6) {
            let strip;
            for (let attempt = 0; attempt < 100; attempt++) {
                const candidate = generateTicketStrip();
                const signatures = candidate.map((grid) => JSON.stringify(grid));
                if (new Set(signatures).size === signatures.length && signatures.every((signature) => !ticketSignatures.has(signature))) {
                    strip = candidate;
                    signatures.forEach((signature) => ticketSignatures.add(signature));
                    break;
                }
            }
            if (!strip) throw new Error("Unable to generate a unique ticket set; please retry.");

            const ticketsToStore = Math.min(6, requestedCount - offset);
            // ADDED: Store a shared identifier so checkout can reserve the exact six-ticket strip.
            const sheetId = `${room._id.toString()}-${existingCount + offset + 1}`;
            const sheetNumber = existingSheetIds.size + Math.floor(offset / 6) + 1;
            for (let index = 0; index < ticketsToStore; index++) {
                const number = existingCount + offset + index + 1;
                documents.push({
                    room: room._id,
                    number,
                    publicCode: `${room.code}-${String(number).padStart(2, "0")}`,
                    grid: strip[index],
                    sheetId,
                    sheetNumber,
                    status: "available",
                });
            }
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
            message: "Failed to generate tickets",
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
                // ADDED: Include the player's room heartbeat fields for the attendance monitor.
                .populate(
                    "user",
                    "name phone roomPresenceRoom roomLastSeen",
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
            message: "Failed to load bookings",
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
                "reference amount fee total paymentMethod paymentStatus status " +
                "upiReference manualPaymentSubmitted paymentSubmittedAt " +
                "paymentVerifiedAt paymentVerifiedBy paymentRejectionReason " +
                "createdAt updatedAt user tickets"
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
            message: "Failed to load payment history",
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
            message: "Failed to load room",
        });
    }
}

export async function resetRoom(req, res) {
    try {
        const code = String(req.params.roomCode || "").trim().toUpperCase();
        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ message: "Room not found" });

        // Do not silently free tickets for a payment already submitted to the admin.
        const awaitingManualReview = await Booking.exists({
            room: room._id,
            status: "pending",
            paymentStatus: "pending",
            manualPaymentSubmitted: true,
        });
        if (awaitingManualReview) {
            return res.status(409).json({
                message: "Review or reject submitted payments before resetting this room.",
            });
        }

        const unpaidPendingBookings = await Booking.find({
            room: room._id,
            status: "pending",
            paymentStatus: "pending",
            manualPaymentSubmitted: false,
        }).select("_id").lean();
        const pendingIds = unpaidPendingBookings.map((booking) => booking._id);

        if (pendingIds.length) {
            await Booking.updateMany(
                { _id: { $in: pendingIds }, status: "pending", paymentStatus: "pending" },
                { $set: { status: "expired", paymentStatus: "expired" } },
            );
            await Ticket.updateMany(
                { room: room._id, booking: { $in: pendingIds }, status: "held" },
                { $set: { status: "available", heldUntil: null, heldBy: null, booking: null } },
            );
        }

        // Release only unbooked temporary holds; confirmed paid tickets stay booked.
        await Ticket.updateMany(
            { room: room._id, status: "held", booking: null },
            { $set: { status: "available", heldUntil: null, heldBy: null, booking: null } },
        );

        room.status = "upcoming";
        room.currentNumber = null;
        room.calledNumbers = [];
        room.autoCaller = false;
        room.gameStartedAt = null;
        room.lastCalledAt = null;
        room.gameVersion = Number(room.gameVersion || 0) + 1;
        room.musicPlaying = false;
        room.musicPosition = 0;
        room.musicUpdatedAt = new Date();
        for (const prize of room.prizes || []) {
            prize.claimed = false;
            prize.claimedByTicket = null;
            prize.claimedByUser = null;
            prize.claimedAt = null;
        }

        await room.save();
        await PrizeClaim.deleteMany({ room: room._id });

        return res.json({ message: "Room reset successfully. Confirmed paid tickets remain booked.", room });
    } catch (error) {
        console.error("Reset room error:", error);
        return res.status(500).json({ message: "Failed to reset room" });
    }
}

export async function startRoom(req, res) {
    try {
        const code = String(req.params.roomCode || "").trim().toUpperCase();
        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ message: "Room not found" });

        if (room.status === "closed" && await PrizeClaim.exists({ room: room._id, prizeId: "full-house", status: "verified" })) {
            return res.status(409).json({ message: "This game has ended with a full house. Reset the room before starting another game." });
        }

        const paidBookingCount = await Booking.countDocuments({
            room: room._id,
            paymentStatus: "paid",
            status: "confirmed",
        });
        if (paidBookingCount < 1) {
            return res.status(400).json({ message: "No tickets have been bought yet. The game cannot start until at least one booking is paid and confirmed." });
        }

        const isResume = room.status === "paused";
        room.status = "live";
        room.autoCaller = true;
        if (!isResume) {
            room.currentNumber = null;
            room.calledNumbers = [];
            room.gameStartedAt = new Date();
            room.gameVersion = Number(room.gameVersion || 0) + 1;
        }
        room.lastCalledAt = new Date();
        await room.save();
        return res.json({ message: isResume ? "Game resumed" : "Game started", room });
    } catch (error) {
        console.error("Start room error:", error);
        return res.status(500).json({ message: "Failed to start game" });
    }
}

export async function pauseRoom(req, res) {
    try {
        const code = String(req.params.roomCode || "").trim().toUpperCase();
        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ message: "Room not found" });
        room.status = "paused";
        room.autoCaller = false;
        await room.save();
        return res.json({ message: "Game paused", room });
    } catch (error) {
        console.error("Pause room error:", error);
        return res.status(500).json({ message: "Failed to pause game" });
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

export async function approveManualPayment(req, res) {
    try {
        const { reference } = req.params;

        const booking = await Booking.findOne({ reference });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        if (
            booking.paymentStatus === "paid" &&
            booking.status === "confirmed"
        ) {
            return res.status(409).json({
                message: "This booking has already been approved",
            });
        }

        if (
            booking.paymentStatus !== "pending" ||
            booking.status !== "pending"
        ) {
            return res.status(409).json({
                message: "This booking is no longer pending",
            });
        }

        if (!booking.manualPaymentSubmitted) {
            return res.status(400).json({
                message:
                    "The player has not submitted the manual payment confirmation",
            });
        }

        // Only approve after independently verifying the UPI payment.
        booking.paymentStatus = "paid";
        booking.status = "confirmed";
        booking.paymentVerifiedAt = new Date();
        booking.paymentVerifiedBy = req.auth?.sub;
        booking.paymentRejectionReason = "";

        await booking.save();

        // Make all tickets in this booking officially booked.
        await Ticket.updateMany(
            {
                _id: { $in: booking.tickets },
                room: booking.room,
            },
            {
                $set: {
                    status: "booked",
                    heldUntil: null,
                    heldBy: null,
                    booking: booking._id,
                },
            },
        );

        return res.json({
            message: "Payment verified and booking approved",
            booking,
        });
    } catch (error) {
        console.error("Approve manual payment error:", error);

        return res.status(500).json({
            message: "Failed to approve payment",
        });
    }
}

export async function rejectManualPayment(req, res) {
    try {
        const { reference } = req.params;
        const reason =
            String(req.body?.reason || "").trim();

        if (!reason) {
            return res.status(400).json({
                message: "Please provide a rejection reason",
            });
        }

        const booking = await Booking.findOne({ reference });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        if (
            booking.paymentStatus !== "pending" ||
            booking.status !== "pending"
        ) {
            return res.status(409).json({
                message: "Only pending bookings can be rejected",
            });
        }

        booking.paymentStatus = "failed";
        booking.status = "cancelled";
        booking.paymentRejectionReason = reason;

        await booking.save();

        // Release the rejected booking's tickets for other players.
        await Ticket.updateMany(
            {
                _id: { $in: booking.tickets },
                room: booking.room,
                booking: booking._id,
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

        return res.json({
            message: "Payment rejected and tickets released",
            booking,
        });
    } catch (error) {
        console.error("Reject manual payment error:", error);

        return res.status(500).json({
            message: "Failed to reject payment",
        });
    }
}
