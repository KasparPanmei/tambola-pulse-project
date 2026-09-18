import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import PrizeClaim from "../models/PrizeClaim.js";

function isMarked(value, calledNumbers) {
    return (
        value !== null &&
        value !== undefined &&
        calledNumbers.has(Number(value))
    );
}

function getPrizeEligibility(prizeId, grid, calledNumbers) {
    if (!Array.isArray(grid)) {
        return false;
    }

    const markedRows = grid.map((row) =>
        Array.isArray(row)
            ? row.filter((value) =>
                isMarked(value, calledNumbers)
            ).length
            : 0
    );

    const totalMarked = markedRows.reduce(
        (total, count) => total + count,
        0
    );

    switch (String(prizeId)) {
        case "early-five":
            return totalMarked >= 5;

        case "top-line":
            return markedRows[0] === 5;

        case "middle-line":
            return markedRows[1] === 5;

        case "bottom-line":
            return markedRows[2] === 5;

        case "four-corners": {
            const firstRow = grid[0] || [];
            const lastRow = grid[2] || [];

            const corners = [
                firstRow.find(
                    (value) =>
                        value !== null &&
                        value !== undefined
                ),
                [...firstRow]
                    .reverse()
                    .find(
                        (value) =>
                            value !== null &&
                            value !== undefined
                    ),
                lastRow.find(
                    (value) =>
                        value !== null &&
                        value !== undefined
                ),
                [...lastRow]
                    .reverse()
                    .find(
                        (value) =>
                            value !== null &&
                            value !== undefined
                    ),
            ];

            return corners.every((value) =>
                isMarked(value, calledNumbers)
            );
        }

        case "full-house":
            return totalMarked === 15;

        default:
            return false;
    }
}

export async function submitClaim(req, res) {
    try {
        const code = req.params.code
            ?.trim()
            .toUpperCase();

        const { prizeId, ticketId } = req.body;

        if (!code) {
            return res.status(400).json({
                message: "Room code is required",
            });
        }

        if (!prizeId) {
            return res.status(400).json({
                message: "Prize ID is required",
            });
        }

        if (!ticketId) {
            return res.status(400).json({
                message: "Ticket ID is required",
            });
        }

        const room = await Room.findOne({ code });

        if (!room) {
            return res.status(404).json({
                message: "Room not found",
            });
        }

        const userId = req.auth?.sub;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        const booking = await Booking.findOne({
            room: room._id,
            user: userId,
            paymentStatus: "paid",
            status: "confirmed",
        }).populate(
            "tickets",
            "_id number publicCode grid status room booking"
        );

        if (!booking) {
            return res.status(403).json({
                message:
                    "You do not have access to this room",
            });
        }

        const playerTicket = booking.tickets?.find(
            (ticket) =>
                String(ticket?._id) === String(ticketId)
        );

        if (!playerTicket) {
            return res.status(403).json({
                message:
                    "This ticket does not belong to your booking",
            });
        }

        const prize = (
            Array.isArray(room.prizes)
                ? room.prizes
                : []
        ).find(
            (item) =>
                String(
                    item.id ||
                    item._id ||
                    ""
                ) === String(prizeId)
        );

        if (!prize) {
            return res.status(404).json({
                message:
                    "Prize not found for this room",
            });
        }

        if (prize.enabled === false) {
            return res.status(400).json({
                message:
                    "This prize is not active",
            });
        }

        if (room.status !== "live") {
            return res.status(400).json({
                message:
                    "Prize claims are only allowed while the game is live",
            });
        }

        const existing = await PrizeClaim.findOne({
            room: room._id,
            ticket: playerTicket._id,
            prizeId: String(prizeId),
            status: {
                $in: [
                    "pending",
                    "verified",
                ],
            },
        });

        if (existing) {
            return res.status(409).json({
                message:
                    "This ticket has already submitted this prize claim.",
                claim: {
                    id: existing._id,
                    _id: existing._id,
                    prizeId: existing.prizeId,
                    prizeName: existing.prizeName,
                    prizeAmount:
                        existing.prizeAmount,
                    status: existing.status,
                    ticket: existing.ticket,
                    claimedAt:
                        existing.claimedAt,
                    verifiedAt:
                        existing.verifiedAt,
                },
            });
        }

        const called = new Set(
            Array.isArray(room.calledNumbers)
                ? room.calledNumbers.map(Number)
                : []
        );

        const grid = Array.isArray(
            playerTicket.grid
        )
            ? playerTicket.grid
            : [];

        const eligible =
            getPrizeEligibility(
                prizeId,
                grid,
                called
            );

        if (!eligible) {
            return res.status(400).json({
                message:
                    "You are not eligible for this prize yet",
            });
        }

        const claim =
            await PrizeClaim.create({
                room: room._id,
                user: userId,
                ticket:
                    playerTicket._id,
                prizeId:
                    String(prizeId),
                prizeName:
                    prize.name ||
                    prize.prizeName ||
                    "Prize",
                prizeAmount:
                    Number(
                        prize.amount ??
                        prize.prizeAmount ??
                        0
                    ),
                status: "pending",
                claimedAt: new Date(),
            });

        return res.status(201).json({
            message:
                "Prize claim submitted successfully",
            claim: {
                id: claim._id,
                _id: claim._id,
                prizeId:
                    claim.prizeId,
                prizeName:
                    claim.prizeName,
                prizeAmount:
                    claim.prizeAmount,
                status:
                    claim.status,
                ticket:
                    playerTicket._id,
                ticketNumber:
                    playerTicket.number,
                ticketPublicCode:
                    playerTicket.publicCode,
                claimedAt:
                    claim.claimedAt,
                verifiedAt:
                    claim.verifiedAt,
            },
        });
    } catch (error) {
        console.error(
            "Submit prize claim error:",
            error
        );

        if (error?.code === 11000) {
            return res.status(409).json({
                message:
                    "This ticket has already submitted this prize claim.",
            });
        }

        return res.status(500).json({
            message:
                error.message ||
                "Unable to submit prize claim",
        });
    }
}

export async function getAdminClaims(req, res) {
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

        const room = await Room.findOne({
            code,
        });

        if (!room) {
            return res.status(404).json({
                message: "Room not found",
            });
        }

        const claims =
            await PrizeClaim.find({
                room: room._id,
            })
                .populate(
                    "user",
                    "name phone"
                )
                .populate(
                    "ticket",
                    "_id number publicCode"
                )
                .sort({
                    createdAt: -1,
                });

        return res.json({
            claims,
        });
    } catch (error) {
        console.error(
            "Get admin claims error:",
            error
        );

        return res.status(500).json({
            message:
                error.message ||
                "Unable to load claims",
        });
    }
}

export async function verifyClaim(req, res) {
    try {
        const { claimId } = req.params;

        if (!claimId) {
            return res.status(400).json({
                message:
                    "Claim ID is required",
            });
        }

        const claim =
            await PrizeClaim.findById(
                claimId
            );

        if (!claim) {
            return res.status(404).json({
                message: "Claim not found",
            });
        }

        if (claim.status !== "pending") {
            return res.status(400).json({
                message:
                    "Only pending claims can be verified",
            });
        }

        claim.status = "verified";
        claim.verifiedAt = new Date();

        await claim.save();

        await PrizeClaim.updateMany(
            {
                room: claim.room,
                prizeId: claim.prizeId,
                _id: {
                    $ne: claim._id,
                },
                status: "pending",
            },
            {
                $set: {
                    status: "rejected",
                },
            }
        );

        const updatedClaim =
            await PrizeClaim.findById(
                claim._id
            )
                .populate(
                    "user",
                    "name phone"
                )
                .populate(
                    "ticket",
                    "_id number publicCode"
                );

        return res.json({
            message:
                "Prize claim verified successfully",
            claim: updatedClaim,
        });
    } catch (error) {
        console.error(
            "Verify claim error:",
            error
        );

        return res.status(500).json({
            message:
                error.message ||
                "Unable to verify claim",
        });
    }
}

export async function rejectClaim(req, res) {
    try {
        const { claimId } = req.params;

        if (!claimId) {
            return res.status(400).json({
                message:
                    "Claim ID is required",
            });
        }

        const claim =
            await PrizeClaim.findById(
                claimId
            );

        if (!claim) {
            return res.status(404).json({
                message: "Claim not found",
            });
        }

        if (claim.status !== "pending") {
            return res.status(400).json({
                message:
                    "Only pending claims can be rejected",
            });
        }

        claim.status = "rejected";

        await claim.save();

        const updatedClaim =
            await PrizeClaim.findById(
                claim._id
            )
                .populate(
                    "user",
                    "name phone"
                )
                .populate(
                    "ticket",
                    "_id number publicCode"
                );

        return res.json({
            message:
                "Prize claim rejected successfully",
            claim: updatedClaim,
        });
    } catch (error) {
        console.error(
            "Reject claim error:",
            error
        );

        return res.status(500).json({
            message:
                error.message ||
                "Unable to reject claim",
        });
    }
}