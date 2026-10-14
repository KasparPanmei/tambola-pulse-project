
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import { makeReference } from "../utils/reference.js";

const HOLD_DURATION_MS = 15 * 60 * 1000;
const PAYMENT_REVIEW_DURATION_MS = 24 * 60 * 60 * 1000;

const clean = (t) => ({
    id: t._id,
    number: t.number,
    publicCode: t.publicCode,
    grid: t.grid,
});

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

function bookingResponse(booking) {
    return {
        id: booking._id,
        reference: booking.reference,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        manualPaymentSubmitted:
            booking.manualPaymentSubmitted || false,
        paymentSubmittedAt:
            booking.paymentSubmittedAt || null,
        paymentVerifiedAt:
            booking.paymentVerifiedAt || null,
        paymentRejectionReason:
            booking.paymentRejectionReason || "",
        upiReference: booking.upiReference || "",
        amount: booking.amount,
        fee: booking.fee || 0,
        total: booking.total,
        expiresAt: booking.expiresAt,
    };
}

export async function holdTickets(req, res) {
    try {
        const { roomCode, ticketIds } = req.body || {};

        if (
            !Array.isArray(ticketIds) ||
            ticketIds.length < 1 ||
            ticketIds.length > 6
        ) {
            return res.status(400).json({
                message: "Select between 1 and 6 tickets.",
            });
        }

        const uniqueIds = [...new Set(ticketIds.map(String))];

        if (uniqueIds.length !== ticketIds.length) {
            return res.status(400).json({
                message: "Duplicate tickets were selected.",
            });
        }

        const code = String(roomCode || "")
            .trim()
            .toUpperCase();

        if (!code) {
            return res.status(400).json({
                message: "Room code is required.",
            });
        }

        await release();

        const room = await Room.findOne({ code });
        const user = await User.findById(req.auth.sub);

        if (!room || !user) {
            return res.status(404).json({
                message: "Room or user not found.",
            });
        }

        const now = new Date();

        const availableTickets = await Ticket.find({
            _id: { $in: uniqueIds },
            room: room._id,
            status: "available",
        });

        if (availableTickets.length !== uniqueIds.length) {
            return res.status(409).json({
                message:
                    "One or more tickets are no longer available.",
            });
        }

        const until = new Date(
            Date.now() + HOLD_DURATION_MS,
        );

        const result = await Ticket.updateMany(
            {
                _id: { $in: uniqueIds },
                room: room._id,
                status: "available",
            },
            {
                $set: {
                    status: "held",
                    heldUntil: until,
                    heldBy: user._id,
                    booking: null,
                },
            },
        );

        if (result.modifiedCount !== uniqueIds.length) {
            return res.status(409).json({
                message:
                    "Some tickets were just taken. Please select again.",
            });
        }

        const heldTickets = await Ticket.find({
            _id: { $in: uniqueIds },
            room: room._id,
            status: "held",
            heldBy: user._id,
            heldUntil: { $gt: now },
            booking: null,
        });

        const total =
            heldTickets.length * Number(room.ticketPrice);

        return res.json({
            expiresAt: until,
            tickets: heldTickets.map(clean),
            amount: total,
            fee: 0,
            total,
        });
    } catch (error) {
        console.error("holdTickets:", error);

        return res.status(500).json({
            message: "Unable to hold tickets.",
        });
    }
}

export async function createBooking(req, res) {
    try {
        const {
            roomCode,
            ticketIds,
            paymentMethod = "upi_qr",
            name,
        } = req.body;

        if (!["upi_qr", "upi_id"].includes(paymentMethod)) {
            return res.status(400).json({
                message:
                    "Choose UPI QR or GPay / UPI ID.",
            });
        }

        // ADDED: Restrict color values to the seven colors offered in checkout.
        const allowedTicketColors = new Set(["yellow", "pink", "green", "blue", "white", "purple", "orange"]);
        if (!allowedTicketColors.has(String(ticketColor))) {
            return res.status(400).json({ message: "Invalid ticket color" });
        }

        if (
            !Array.isArray(ticketIds) ||
            ticketIds.length < 1 ||
            ticketIds.length > 6
        ) {
            return res.status(400).json({
                message: "Select between 1 and 6 tickets.",
            });
        }

        const uniqueIds = [...new Set(ticketIds.map(String))];

        if (uniqueIds.length !== ticketIds.length) {
            return res.status(400).json({
                message: "Duplicate tickets were selected.",
            });
        }

        const code = String(roomCode || "")
            .trim()
            .toUpperCase();

        if (!code) {
            return res.status(400).json({
                message: "Room code is required.",
            });
        }

        const room = await Room.findOne({ code });
        const user = await User.findById(req.auth.sub);

        if (!room || !user) {
            return res.status(404).json({
                message: "Room or user not found.",
            });
        }

        const requestedName = String(name || "").trim();

        if (
            requestedName &&
            user.name?.trim() &&
            user.name.trim().toLocaleLowerCase() !==
            requestedName.toLocaleLowerCase()
        ) {
            return res.status(409).json({
                message:
                    "This phone number is already registered under a different name. Please enter another phone number.",
            });
        }

        const tickets = await Ticket.find({
            _id: { $in: uniqueIds },
            room: room._id,
            status: "held",
            heldBy: user._id,
            heldUntil: { $gt: new Date() },
            booking: null,
        });

        if (tickets.length !== uniqueIds.length) {
            return res.status(409).json({
                message:
                    "Your ticket hold expired or is invalid. Please select your tickets again.",
            });
        }

        const amount =
            tickets.length * Number(room.ticketPrice);

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                message: "The booking amount is invalid.",
            });
        }

        const reference = makeReference("TAM");

        const expiresAt = new Date(
            Date.now() + PAYMENT_REVIEW_DURATION_MS,
        );

        const booking = await Booking.create({
            reference,
            room: room._id,
            user: user._id,
            tickets: tickets.map((ticket) => ticket._id),
            amount,
            fee: 0,
            total: amount,
            paymentMethod,
            paymentStatus: "pending",
            status: "pending",
            expiresAt,
            upiReference: "",
            manualPaymentSubmitted: false,
        });

        const assigned = await Ticket.updateMany(
            {
                _id: { $in: tickets.map((ticket) => ticket._id) },
                room: room._id,
                status: "held",
                heldBy: user._id,
                heldUntil: { $gt: new Date() },
                booking: null,
            },
            {
                $set: {
                    booking: b._id,
                },
            },
        );

        if (assigned.modifiedCount !== tickets.length) {
            await Booking.deleteOne({ _id: booking._id });

            await Ticket.updateMany(
                {
                    _id: { $in: tickets.map((ticket) => ticket._id) },
                    booking: booking._id,
                    status: "held",
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

            return res.status(409).json({
                message:
                    "Your ticket reservation changed. Please select your tickets again.",
            });
        }

        const upiId = String(
            process.env.UPI_ID || "",
        ).trim();
        const merchantName = String(
            process.env.MERCHANT_NAME || "Tambola Pulse",
        ).trim();

        const whatsappNumber = String(
            process.env.ADMIN_WHATSAPP_NUMBER ||
            process.env.ADMIN_PHONE ||
            "",
        ).replace(/\D/g, "");

        return res.status(201).json({
            success: true,
            booking: {
                ...bookingResponse(booking),
                tickets: tickets.map(clean),
                room: {
                    code: room.code,
                    ticketPrice: room.ticketPrice,
                },
                upiId,
                merchantName,
                whatsappNumber,
            },
        });
    } catch (error) {
        console.error("createBooking:", error);

        return res.status(500).json({
            message:
                error.message || "Unable to create booking.",
        });
    }
}

export async function submitManualPayment(req, res) {
    try {
        const booking = await Booking.findOne({
            reference: req.params.reference,
            user: req.auth.sub,
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found.",
            });
        }

        if (
            booking.paymentStatus === "paid" &&
            booking.status === "confirmed"
        ) {
            return res.json({
                success: true,
                status: "confirmed",
                message: "This booking is already verified.",
            });
        }

        if (
            booking.paymentStatus !== "pending" ||
            booking.status !== "pending"
        ) {
            return res.status(409).json({
                message:
                    "This booking is no longer awaiting verification.",
            });
        }

        if (booking.expiresAt && booking.expiresAt <= new Date()) {
            return res.status(410).json({
                message:
                    "This booking has expired. Please create a new booking.",
            });
        }

        const {
            confirmed,
            upiTransactionId = "",
        } = req.body || {};

        if (confirmed !== true) {
            return res.status(400).json({
                message:
                    "Confirm that you have paid and sent the payment screenshot to the admin on WhatsApp.",
            });
        }

        if (!["upi_qr", "upi_id"].includes(booking.paymentMethod)) {
            return res.status(400).json({
                message: "Unsupported payment method.",
            });
        }

        booking.manualPaymentSubmitted = true;
        booking.paymentSubmittedAt = new Date();
        booking.upiReference = String(upiTransactionId)
            .trim()
            .slice(0, 120);

        await booking.save();

        return res.json({
            success: true,
            status: "pending_verification",
            message:
                "Payment details submitted. Your booking will be confirmed after admin verification.",
            booking: bookingResponse(booking),
        });
    } catch (error) {
        console.error("submitManualPayment:", error);

        return res.status(500).json({
            message: "Unable to submit payment details.",
        });
    }
}

export async function getBookingStatus(req, res) {
    try {
        const booking = await Booking.findOne({
            reference: req.params.reference,
            user: req.auth.sub,
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found.",
            });
        }

        if (
            booking.paymentStatus !== "paid" &&
            !booking.manualPaymentSubmitted &&
            booking.status === "pending" &&
            booking.expiresAt &&
            booking.expiresAt <= new Date()
        ) {
            booking.paymentStatus = "failed";
            booking.status = "expired";

            await booking.save();

            await Ticket.updateMany(
                {
                    booking: booking._id,
                    status: "held",
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

        return res.json({
            booking: bookingResponse(booking),
        });
    } catch (error) {
        console.error("getBookingStatus:", error);

        return res.status(500).json({
            message: "Unable to get booking status.",
        });
    }
}

export async function joinRoom(req, res) {
    try {
        const { roomCode, phone } = req.body || {};

        const code = String(roomCode || "")
            .trim()
            .toUpperCase();

        const cleanPhone = (value) =>
            String(value || "")
                .replace(/\D/g, "")
                .replace(/^91/, "")
                .replace(/^0/, "");

        if (!code) {
            return res.status(400).json({
                message: "Room code is required.",
            });
        }

        if (!cleanPhone(phone)) {
            return res.status(400).json({
                message: "Mobile number is required.",
            });
        }

        const room = await Room.findOne({ code });

        if (!room) {
            return res.status(404).json({
                message: "Invalid room code.",
            });
        }

        const user = await User.findById(req.auth.sub);

        if (!user) {
            return res.status(401).json({
                message: "User account not found.",
            });
        }

        if (cleanPhone(user.phone) !== cleanPhone(phone)) {
            return res.status(403).json({
                message:
                    "The mobile number does not match your registered account.",
            });
        }

        const bookings = await Booking.find({
            room: room._id,
            user: user._id,
            paymentStatus: "paid",
            status: "confirmed",
        })
            .populate({
                path: "tickets",
                select:
                    "_id number publicCode grid status",
            });

        if (!bookings.length) {
            const pendingBooking = await Booking.exists({
                room: room._id,
                user: user._id,
                status: "pending",
                paymentStatus: "pending",
            });

            return res.status(403).json({
                message: pendingBooking
                    ? "Payment verification is pending. You can join the GameRoom after the admin confirms your booking."
                    : "No confirmed ticket booking was found for this room.",
                status: pendingBooking
                    ? "pending_verification"
                    : "booking_required",
            });
        }

        const ticketMap = new Map();

        for (const booking of bookings) {
            for (const ticket of booking.tickets || []) {
                if (ticket?._id) {
                    ticketMap.set(
                        ticket._id.toString(),
                        ticket,
                    );
                }
            }
        }

        const tickets = [...ticketMap.values()].sort(
            (a, b) => a.number - b.number,
        );

        if (!tickets.length) {
            return res.status(403).json({
                message:
                    "No confirmed tickets were found for your bookings.",
            });
        }

        const latestBooking = bookings[bookings.length - 1];

        return res.json({
            success: true,
            room: {
                id: room._id,
                code: room.code,
                title: room.title,
                description: room.description,
                status: room.status,
                startsAt: room.startsAt,
                ticketPrice: room.ticketPrice,
                jackpot: room.jackpot,
                balls: room.balls,
            },
            player: {
                id: user._id,
                name: user.name,
                phone: user.phone,
            },
            booking: {
                reference: latestBooking.reference,
                paymentStatus: latestBooking.paymentStatus,
                status: latestBooking.status,
            },
            bookings: bookings.map((booking) => ({
                reference: booking.reference,
                paymentStatus: booking.paymentStatus,
                status: booking.status,
            })),
            tickets,
        });
    } catch (error) {
        console.error("joinRoom:", error);

        return res.status(500).json({
            message: "Unable to verify room access.",
        });
    }
}
