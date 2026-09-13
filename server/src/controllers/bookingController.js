import crypto from "crypto";

import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import { makeReference } from "../utils/reference.js";
import razorpay from "../utils/razorpay.js";

const HOLD_DURATION_MS = 15 * 60 * 1000;

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

function bookingResponse(b) {
    return {
        reference: b.reference,
        paymentStatus: b.paymentStatus,
        status: b.status,
        expiresAt: b.expiresAt,
        razorpayOrderId: b.razorpayOrderId || null,
        razorpayPaymentId:
            b.razorpayPaymentId || null,
    };
}

async function confirmBookingPayment(
    booking,
    payment,
) {
    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    booking.razorpayPaymentId = payment.id;

    await booking.save();

    await Ticket.updateMany(
        { booking: booking._id },
        {
            $set: {
                status: "booked",
                heldUntil: null,
                heldBy: null,
            },
        },
    );
}

/* =========================================================
   HOLD TICKETS
========================================================= */

export async function holdTickets(req, res) {
    try {
        const { roomCode, ticketIds } = req.body;

        if (
            !Array.isArray(ticketIds) ||
            ticketIds.length < 1 ||
            ticketIds.length > 6
        ) {
            return res.status(400).json({
                message:
                    "Select between 1 and 6 tickets",
            });
        }

        await release();

        const room = await Room.findOne({
            code: roomCode,
        });

        const user = await User.findById(
            req.auth.sub,
        );

        if (!room || !user) {
            return res.status(404).json({
                message:
                    "Room or user not found",
            });
        }

        const ts = await Ticket.find({
            _id: { $in: ticketIds },
            room: room._id,
            status: "available",
        });

        if (ts.length !== ticketIds.length) {
            return res.status(409).json({
                message:
                    "One or more tickets are no longer available",
            });
        }

        const until = new Date(
            Date.now() + HOLD_DURATION_MS,
        );

        await Ticket.updateMany(
            {
                _id: { $in: ticketIds },
                status: "available",
            },
            {
                $set: {
                    status: "held",
                    heldUntil: until,
                    heldBy: user._id,
                },
            },
        );

        const held = await Ticket.find({
            _id: { $in: ticketIds },
        });

        return res.json({
            expiresAt: until,
            tickets: held.map(clean),
            amount:
                held.length * room.ticketPrice,
            fee: 0,
            total:
                held.length * room.ticketPrice,
        });
    } catch (error) {
        console.error(
            "holdTickets:",
            error,
        );

        return res.status(500).json({
            message:
                "Unable to hold tickets",
        });
    }
}

/* =========================================================
   CREATE BOOKING + RAZORPAY ORDER
========================================================= */

export async function createBooking(req, res) {
    try {
        const {
            roomCode,
            ticketIds,
            paymentMethod = "upi_qr",
        } = req.body;

        if (
            ![
                "upi_qr",
                "upi_id",
                "card",
            ].includes(paymentMethod)
        ) {
            return res.status(400).json({
                message:
                    "Invalid payment method",
            });
        }

        if (
            !Array.isArray(ticketIds) ||
            ticketIds.length < 1 ||
            ticketIds.length > 6
        ) {
            return res.status(400).json({
                message:
                    "Select between 1 and 6 tickets",
            });
        }

        const room = await Room.findOne({
            code: roomCode,
        });

        const user = await User.findById(
            req.auth.sub,
        );

        if (!room || !user) {
            return res.status(404).json({
                message:
                    "Room or user not found",
            });
        }

        const ts = await Ticket.find({
            _id: { $in: ticketIds },
            room: room._id,
            status: "held",
            heldBy: user._id,
            heldUntil: { $gt: new Date() },
        });

        if (ts.length !== ticketIds.length) {
            return res.status(409).json({
                message:
                    "Ticket hold expired or invalid",
            });
        }

        const amount =
            ts.length * room.ticketPrice;

        const ref =
            makeReference("TAM");

        const expiresAt = new Date(
            Date.now() + HOLD_DURATION_MS,
        );

        /*
         * Create the Razorpay order.
         *
         * Razorpay expects the amount in paise:
         *
         * ₹100 = 10000 paise
         */
        const order =
            await razorpay.orders.create({
                amount: Math.round(
                    amount * 100,
                ),
                currency: "INR",
                receipt: ref,
                notes: {
                    booking_reference: ref,
                    room_code: room.code,
                },
            });

        /*
         * Create our booking after the
         * Razorpay order succeeds.
         */
        const b = await Booking.create({
            reference: ref,
            room: room._id,
            user: user._id,
            tickets: ts.map(
                (t) => t._id,
            ),
            amount,
            fee: 0,
            total: amount,
            paymentMethod,
            expiresAt,
            upiReference:
                `${ref}-PAY01`,
            razorpayOrderId: order.id,
        });

        await Ticket.updateMany(
            {
                _id: {
                    $in: ticketIds,
                },
            },
            {
                $set: {
                    booking: b._id,
                },
            },
        );

        return res.status(201).json({
            booking: {
                id: b._id,
                reference: b.reference,
                total: b.total,
                amount: b.amount,
                fee: 0,
                paymentMethod:
                    b.paymentMethod,
                expiresAt:
                    b.expiresAt,
                upiReference:
                    b.upiReference,

                /*
                 * These values are safe
                 * to send to React.
                 *
                 * NEVER send KEY_SECRET.
                 */
                razorpayOrderId:
                    order.id,

                razorpayKeyId:
                    process.env
                        .RAZORPAY_KEY_ID,

                tickets:
                    ts.map(clean),

                room: {
                    code: room.code,
                },
            },
        });
    } catch (error) {
        console.error(
            "createBooking:",
            error,
        );

        return res.status(500).json({
            message:
                "Unable to create booking",
        });
    }
}

/* =========================================================
   VERIFY RAZORPAY PAYMENT
========================================================= */

export async function verifyBookingPayment(
    req,
    res,
) {
    try {
        const booking =
            await Booking.findOne({
                reference:
                    req.params.reference,
                user: req.auth.sub,
            });

        if (!booking) {
            return res.status(404).json({
                message:
                    "Booking not found",
            });
        }

        /*
         * Already confirmed.
         */
        if (
            booking.paymentStatus ===
            "paid"
        ) {
            return res.json({
                verified: true,
                paymentCompleted: true,
                message:
                    "Payment verified",
                booking:
                    bookingResponse(
                        booking,
                    ),
            });
        }

        /*
         * Booking expired.
         */
        if (
            booking.expiresAt <=
            new Date()
        ) {
            booking.paymentStatus =
                "failed";

            booking.status =
                "expired";

            await booking.save();

            await Ticket.updateMany(
                {
                    booking:
                        booking._id,
                },
                {
                    $set: {
                        status:
                            "available",
                        heldUntil:
                            null,
                        heldBy: null,
                        booking:
                            null,
                    },
                },
            );

            return res.status(400).json({
                verified: false,
                paymentCompleted:
                    false,
                message:
                    "Payment session expired",
            });
        }

        if (!booking.razorpayOrderId) {
            return res.status(400).json({
                verified: false,
                paymentCompleted:
                    false,
                message:
                    "Razorpay order not found for this booking.",
            });
        }

        /*
         * Fetch all payments for this
         * Razorpay order.
         */
        const payments =
            await razorpay.orders.fetchPayments(
                booking.razorpayOrderId,
            );

        const expectedAmount =
            Math.round(
                booking.total * 100,
            );

        /*
         * Look for a successful,
         * captured payment matching
         * the exact booking amount.
         */
        const payment =
            payments.items?.find(
                (item) =>
                    item.status ===
                    "captured" &&
                    Number(
                        item.amount,
                    ) ===
                    expectedAmount &&
                    item.currency ===
                    "INR",
            );

        /*
         * No successful payment yet.
         */
        if (!payment) {
            return res.json({
                verified: false,
                paymentCompleted:
                    false,
                message:
                    "Payment not completed. Please complete the Razorpay payment first.",
                booking:
                    bookingResponse(
                        booking,
                    ),
            });
        }

        /*
         * Payment is genuine and
         * matches the booking.
         */
        await confirmBookingPayment(
            booking,
            payment,
        );

        return res.json({
            verified: true,
            paymentCompleted:
                true,
            message:
                "Payment verified",
            booking:
                bookingResponse(
                    booking,
                ),
        });
    } catch (error) {
        console.error(
            "verifyBookingPayment:",
            error,
        );

        return res.status(500).json({
            verified: false,
            paymentCompleted:
                false,
            message:
                "Payment verification failed",
        });
    }
}

/* =========================================================
   RAZORPAY WEBHOOK
========================================================= */

export async function razorpayWebhook(
    req,
    res,
) {
    try {
        const signature =
            req.headers[
            "x-razorpay-signature"
            ];

        if (!signature) {
            return res.status(400).json({
                message:
                    "Missing Razorpay signature",
            });
        }

        const secret =
            process.env
                .RAZORPAY_WEBHOOK_SECRET;

        if (!secret) {
            console.error(
                "RAZORPAY_WEBHOOK_SECRET is missing",
            );

            return res.status(500).json({
                message:
                    "Webhook secret not configured",
            });
        }

        const expectedSignature =
            crypto
                .createHmac(
                    "sha256",
                    secret,
                )
                .update(req.body)
                .digest("hex");

        const valid =
            signature.length ===
            expectedSignature.length &&
            crypto.timingSafeEqual(
                Buffer.from(
                    signature,
                ),
                Buffer.from(
                    expectedSignature,
                ),
            );

        if (!valid) {
            return res.status(400).json({
                message:
                    "Invalid webhook signature",
            });
        }

        const event =
            JSON.parse(
                req.body.toString(
                    "utf8",
                ),
            );

        /*
         * payment.captured is the important
         * event for our application.
         */
        if (
            event.event ===
            "payment.captured"
        ) {
            const payment =
                event.payload
                    ?.payment
                    ?.entity;

            if (!payment) {
                return res.status(
                    200,
                ).json({
                    received: true,
                });
            }

            const orderId =
                payment.order_id;

            if (!orderId) {
                return res.status(
                    200,
                ).json({
                    received: true,
                });
            }

            const booking =
                await Booking.findOne({
                    razorpayOrderId:
                        orderId,
                });

            if (!booking) {
                return res.status(
                    200,
                ).json({
                    received: true,
                });
            }

            /*
             * Don't process the same
             * payment twice.
             */
            if (
                booking.paymentStatus ===
                "paid"
            ) {
                return res.status(
                    200,
                ).json({
                    received: true,
                });
            }

            const expectedAmount =
                Math.round(
                    booking.total * 100,
                );

            if (
                payment.status !==
                "captured" ||
                Number(
                    payment.amount,
                ) !==
                expectedAmount ||
                payment.currency !==
                "INR"
            ) {
                console.warn(
                    "Rejected payment:",
                    payment.id,
                );

                return res.status(
                    200,
                ).json({
                    received: true,
                });
            }

            await confirmBookingPayment(
                booking,
                payment,
            );

            console.log(
                `Payment confirmed: ${booking.reference}`,
            );
        }

        return res.status(200).json({
            received: true,
        });
    } catch (error) {
        console.error(
            "razorpayWebhook:",
            error,
        );

        return res.status(500).json({
            message:
                "Webhook processing failed",
        });
    }
}

/* =========================================================
   GET BOOKING STATUS
========================================================= */

export async function getBookingStatus(
    req,
    res,
) {
    try {
        const booking =
            await Booking.findOne({
                reference:
                    req.params.reference,
                user: req.auth.sub,
            });

        if (!booking) {
            return res.status(404).json({
                message:
                    "Booking not found",
            });
        }

        if (
            booking.paymentStatus !==
            "paid" &&
            booking.expiresAt <=
            new Date()
        ) {
            booking.paymentStatus =
                "failed";

            booking.status =
                "expired";

            await booking.save();

            await Ticket.updateMany(
                {
                    booking:
                        booking._id,
                },
                {
                    $set: {
                        status:
                            "available",
                        heldUntil:
                            null,
                        heldBy: null,
                        booking:
                            null,
                    },
                },
            );
        }

        return res.json({
            booking:
                bookingResponse(
                    booking,
                ),
        });
    } catch (error) {
        console.error(
            "getBookingStatus:",
            error,
        );

        return res.status(500).json({
            message:
                "Unable to get booking status",
        });
    }
}