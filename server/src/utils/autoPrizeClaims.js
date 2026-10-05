import Booking from "../models/Booking.js";
import PrizeClaim from "../models/PrizeClaim.js";
import Room from "../models/Room.js";
import Ticket from "../models/Ticket.js";

function isMarked(value, calledNumbers) {
    return (
        value !== null &&
        value !== undefined &&
        calledNumbers.has(Number(value))
    );
}

export function getPrizeEligibility(prizeId, grid, calledNumbers) {
    if (!Array.isArray(grid)) return false;

    const markedRows = grid.map((row) =>
        Array.isArray(row)
            ? row.filter((value) => isMarked(value, calledNumbers)).length
            : 0,
    );
    const totalMarked = markedRows.reduce((total, count) => total + count, 0);

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
                firstRow.find((value) => value !== null && value !== undefined),
                [...firstRow].reverse().find((value) => value !== null && value !== undefined),
                lastRow.find((value) => value !== null && value !== undefined),
                [...lastRow].reverse().find((value) => value !== null && value !== undefined),
            ];
            return corners.every((value) => isMarked(value, calledNumbers));
        }
        case "full-house":
            return totalMarked === 15;
        default:
            return false;
    }
}

function idOf(value) {
    return value?._id || value;
}

function ticketOrder(a, b) {
    const createdDifference =
        new Date(a.ticket.createdAt || 0).getTime() -
        new Date(b.ticket.createdAt || 0).getTime();
    return (
        createdDifference ||
        Number(a.ticket.number || 0) - Number(b.ticket.number || 0) ||
        String(a.ticket._id).localeCompare(String(b.ticket._id))
    );
}

async function markRoomPrizeClaimed(roomId, prizeId, winner, claimedAt) {
    // CHANGED: This conditional single-document update is the concurrency guard—only one ticket can occupy each prize slot.
    return Room.findOneAndUpdate(
        {
            _id: roomId,
            status: "live",
            prizes: {
                $elemMatch: {
                    id: String(prizeId),
                    enabled: { $ne: false },
                    claimed: { $ne: true },
                },
            },
        },
        {
            $set: {
                "prizes.$.claimed": true,
                "prizes.$.claimedByTicket": idOf(winner.ticket),
                "prizes.$.claimedByUser": idOf(winner.user),
                "prizes.$.claimedAt": claimedAt,
            },
        },
        { new: true },
    );
}

async function saveVerifiedClaim(roomId, prize, winner, claimedAt) {
    // CHANGED: Upsert makes retries idempotent when recovering a room prize slot after a transient claim-record write failure.
    return PrizeClaim.findOneAndUpdate(
        {
            room: roomId,
            prizeId: String(prize.id),
            ticket: idOf(winner.ticket),
        },
        {
            $setOnInsert: {
                room: roomId,
                user: idOf(winner.user),
                ticket: idOf(winner.ticket),
                prizeId: String(prize.id),
                prizeName: prize.name || prize.prizeName || "Prize",
                prizeAmount: Number(prize.amount ?? prize.prizeAmount ?? 0),
                status: "verified",
                claimedAt,
                verifiedAt: claimedAt,
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    );
}

async function backfillRoomPrize(room, prize, activeClaim) {
    const ticket = await Ticket.findById(activeClaim.ticket)
        .select("_id number publicCode createdAt")
        .lean();
    if (!ticket) return;

    const winner = { ticket, user: activeClaim.user };
    const claimedAt = activeClaim.claimedAt || new Date();
    const updated = await markRoomPrizeClaimed(
        room._id,
        prize.id,
        winner,
        claimedAt,
    );
    if (updated) {
        // CHANGED: Keep the embedded prize table consistent with existing claims created before automatic claiming was enabled.
        await saveVerifiedClaim(room._id, prize, winner, claimedAt);
    }
}

export async function autoClaimEligiblePrizes(roomSnapshot) {
    if (
        !roomSnapshot?._id ||
        roomSnapshot.status !== "live" ||
        !Array.isArray(roomSnapshot.prizes) ||
        !Array.isArray(roomSnapshot.calledNumbers)
    ) {
        return [];
    }

    const [bookings, activeClaims] = await Promise.all([
        Booking.find({
            room: roomSnapshot._id,
            paymentStatus: "paid",
            status: "confirmed",
        })
            .select("user tickets")
            .populate({
                path: "tickets",
                match: { room: roomSnapshot._id, status: "booked" },
                select: "_id number publicCode grid status createdAt",
            })
            .lean(),
        PrizeClaim.find({
            room: roomSnapshot._id,
            status: { $in: ["pending", "verified"] },
        })
            .sort({ createdAt: 1, _id: 1 })
            .lean(),
    ]);

    const candidates = bookings.flatMap((booking) =>
        (booking.tickets || [])
            .filter((ticket) => Array.isArray(ticket.grid))
            .map((ticket) => ({ ticket, user: booking.user })),
    ).sort(ticketOrder);
    const calledNumbers = new Set(roomSnapshot.calledNumbers.map(Number));
    const claimsByPrize = new Map();
    for (const claim of activeClaims) {
        const key = String(claim.prizeId);
        if (!claimsByPrize.has(key)) claimsByPrize.set(key, []);
        claimsByPrize.get(key).push(claim);
    }

    const awarded = [];

    for (const prize of roomSnapshot.prizes) {
        if (!prize?.id || prize.enabled === false) continue;
        const prizeId = String(prize.id);
        const existingClaims = claimsByPrize.get(prizeId) || [];

        if (existingClaims.length) {
            // CHANGED: Resolve any legacy/manual pending record into a single automatic winner and update the room's displayed prize state.
            const winnerClaim = existingClaims[0];
            if (winnerClaim.status === "pending") {
                await PrizeClaim.updateOne(
                    { _id: winnerClaim._id, status: "pending" },
                    { $set: { status: "verified", verifiedAt: new Date() } },
                );
            }
            if (existingClaims.length > 1) {
                await PrizeClaim.updateMany(
                    {
                        room: roomSnapshot._id,
                        prizeId,
                        _id: { $ne: winnerClaim._id },
                        status: { $in: ["pending", "verified"] },
                    },
                    { $set: { status: "rejected" } },
                );
            }
            if (!prize.claimed) {
                await backfillRoomPrize(roomSnapshot, prize, winnerClaim);
            } else if (prize.claimedByTicket && prize.claimedByUser) {
                // CHANGED: Recover the verified claim record if the room slot committed but the claim write was interrupted.
                const existingRecord = await PrizeClaim.exists({
                    room: roomSnapshot._id,
                    prizeId,
                    ticket: idOf(prize.claimedByTicket),
                });
                if (!existingRecord) {
                    const winner = {
                        ticket: { _id: idOf(prize.claimedByTicket) },
                        user: idOf(prize.claimedByUser),
                    };
                    await saveVerifiedClaim(
                        roomSnapshot._id,
                        prize,
                        winner,
                        prize.claimedAt || new Date(),
                    );
                }
            }
            continue;
        }

        if (prize.claimed) {
            if (prize.claimedByTicket && prize.claimedByUser) {
                // CHANGED: Rebuild a missing claim document from the already-reserved room prize slot without selecting a second winner.
                const ticket = await Ticket.findById(prize.claimedByTicket)
                    .select("_id number publicCode createdAt")
                    .lean();
                if (ticket) {
                    await saveVerifiedClaim(
                        roomSnapshot._id,
                        prize,
                        { ticket, user: prize.claimedByUser },
                        prize.claimedAt || new Date(),
                    );
                }
            }
            continue;
        }

        const winner = candidates.find(({ ticket }) =>
            getPrizeEligibility(prizeId, ticket.grid, calledNumbers),
        );
        if (!winner) continue;

        const claimedAt = new Date();
        const updatedRoom = await markRoomPrizeClaimed(
            roomSnapshot._id,
            prizeId,
            winner,
            claimedAt,
        );
        if (!updatedRoom) continue;

        const savedClaim = await saveVerifiedClaim(
            roomSnapshot._id,
            prize,
            winner,
            claimedAt,
        );
        awarded.push(savedClaim);
    }

    return awarded;
}
