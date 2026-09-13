import { useEffect, useState } from "react";
import {
    Check,
    Info,
    ShieldCheck,
    Smartphone,
    ArrowLeft,
} from "lucide-react";

import api from "../lib/api.js";
import Countdown from "./Countdown.jsx";

export default function PaymentScreen({
    booking,
    onBack,
    onSuccess,
}) {
    const [loading, setLoading] =
        useState(false);

    const [verifying, setVerifying] =
        useState(false);

    const [success, setSuccess] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!success) return;

        const timer = setTimeout(() => {
            onSuccess();
        }, 1200);

        return () =>
            clearTimeout(timer);
    }, [success, onSuccess]);

    /*
     * Load Razorpay Checkout script.
     */
    function loadRazorpay() {
        return new Promise(
            (resolve) => {
                if (
                    window.Razorpay
                ) {
                    resolve(true);
                    return;
                }

                const script =
                    document.createElement(
                        "script",
                    );

                script.src =
                    "https://checkout.razorpay.com/v1/checkout.js";

                script.onload = () =>
                    resolve(true);

                script.onerror = () =>
                    resolve(false);

                document.body.appendChild(
                    script,
                );
            },
        );
    }

    /*
     * Open Razorpay Checkout.
     */
    async function pay() {
        setError("");
        setLoading(true);

        try {
            const loaded =
                await loadRazorpay();

            if (!loaded) {
                throw new Error(
                    "Unable to load Razorpay Checkout.",
                );
            }

            if (
                !booking.razorpayOrderId ||
                !booking.razorpayKeyId
            ) {
                throw new Error(
                    "Razorpay order information is missing.",
                );
            }

            const options = {
                key:
                    booking.razorpayKeyId,

                amount:
                    Math.round(
                        booking.total *
                        100,
                    ),

                currency: "INR",

                name:
                    "Tambola Pulse",

                description:
                    `Tambola booking ${booking.reference}`,

                order_id:
                    booking.razorpayOrderId,

                prefill: {
                    name:
                        booking.user?.name ||
                        "",
                },

                theme: {
                    color:
                        "#f59e0b",
                },

                handler:
                    async function (
                        response,
                    ) {
                        /*
                         * Razorpay has returned a
                         * successful checkout response.
                         *
                         * We STILL verify it through
                         * our backend.
                         */
                        await verifyPayment(
                            response,
                        );
                    },

                modal: {
                    ondismiss:
                        function () {
                            setLoading(
                                false,
                            );
                        },
                },
            };

            const rzp =
                new window.Razorpay(
                    options,
                );

            rzp.on(
                "payment.failed",
                function (
                    response,
                ) {
                    setLoading(
                        false,
                    );

                    setError(
                        response
                            ?.error
                            ?.description ||
                        "Payment failed.",
                    );
                },
            );

            rzp.open();
        } catch (e) {
            setLoading(false);

            setError(
                e.message ||
                "Unable to start payment.",
            );
        }
    }

    /*
     * Verify the Razorpay payment
     * through our backend.
     */
    async function verifyPayment(
        razorpayResponse,
    ) {
        setError("");
        setVerifying(true);

        try {
            /*
             * Send the Razorpay checkout
             * response to our backend.
             *
             * The backend verifies the
             * signature and payment.
             */
            const { data } =
                await api.post(
                    `/bookings/${booking.reference}/verify-payment`,
                    {
                        razorpayPaymentId:
                            razorpayResponse
                                .razorpay_payment_id,

                        razorpayOrderId:
                            razorpayResponse
                                .razorpay_order_id,

                        razorpaySignature:
                            razorpayResponse
                                .razorpay_signature,
                    },
                );

            if (
                data.verified
            ) {
                setSuccess(true);
                return;
            }

            setError(
                data.message ||
                "Payment not completed.",
            );
        } catch (e) {
            setError(
                e.response
                    ?.data
                    ?.message ||
                "Payment verification failed.",
            );
        } finally {
            setVerifying(false);
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="app">
                <main className="page qrpage">
                    <div
                        className="success stack"
                        style={{
                            marginTop: 50,
                        }}
                    >
                        <Check
                            size={36}
                            color="var(--green)"
                        />

                        <div className="title">
                            Payment Verified!
                        </div>

                        <div className="muted">
                            Your tickets are
                            confirmed.
                            Entering the room...
                        </div>

                        <span className="pill green">
                            {booking.reference}
                        </span>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app">
            <main className="page qrpage">

                <button
                    className="btn ghost"
                    style={{
                        justifyContent:
                            "flex-start",
                        paddingLeft: 0,
                    }}
                    onClick={onBack}
                    disabled={
                        loading ||
                        verifying
                    }
                >
                    <ArrowLeft
                        size={18}
                    />
                    Change Payment
                </button>

                <div className="card pad stack">

                    <div
                        className="row"
                    >
                        <div>
                            <div className="section-title">
                                Complete Payment
                            </div>

                            <div className="small muted">
                                Secure Razorpay
                                Checkout
                            </div>
                        </div>

                        <span className="pill green">
                            TEST MODE
                        </span>
                    </div>

                    <div
                        className="summary"
                    >
                        <div className="sumline">
                            <span>
                                Booking
                            </span>

                            <strong>
                                {
                                    booking.reference
                                }
                            </strong>
                        </div>

                        <div className="sumline">
                            <span>
                                Tickets
                            </span>

                            <strong>
                                {
                                    booking
                                        .tickets
                                        ?.length ||
                                    0
                                }
                            </strong>
                        </div>

                        <div className="sumline total">
                            <span>
                                Total
                            </span>

                            <strong>
                                ₹
                                {
                                    booking.total
                                }
                            </strong>
                        </div>
                    </div>

                    <div
                        className="waiting"
                    >
                        <ShieldCheck
                            size={18}
                        />

                        Your payment is
                        processed securely
                        by Razorpay.
                    </div>

                    <div
                        className="info"
                    >
                        <Info
                            size={18}
                        />

                        <span>
                            This is Razorpay
                            <strong>
                                {" "}
                                Test Mode
                            </strong>
                            . No real money
                            will be charged.
                        </span>
                    </div>

                    <button
                        className="btn primary"
                        onClick={pay}
                        disabled={
                            loading ||
                            verifying
                        }
                    >
                        <Smartphone
                            size={20}
                        />

                        {loading ||
                            verifying
                            ? "Processing..."
                            : `Pay ₹${booking.total} with Razorpay`}
                    </button>

                    {error && (
                        <div
                            className="payment-error"
                            role="alert"
                        >
                            <strong>
                                Payment Not
                                Completed
                            </strong>

                            <span>
                                {error}
                            </span>
                        </div>
                    )}

                    <div className="small muted">
                        QR scanning is not
                        used in Test Mode.
                        Use Razorpay Checkout
                        to simulate the
                        payment.
                    </div>
                </div>

                <div className="card pad stack">

                    <div className="row">
                        <div className="gap">
                            <ShieldCheck
                                size={20}
                                color="var(--green)"
                            />

                            <div>
                                <strong>
                                    Tambola Pulse
                                </strong>

                                <div className="small muted">
                                    Secure payment
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="summary">
                        <div className="row">
                            <span className="muted">
                                Allocated Tickets
                            </span>

                            <div
                                className="gap"
                                style={{
                                    flexWrap:
                                        "wrap",
                                    justifyContent:
                                        "flex-end",
                                }}
                            >
                                {booking.tickets?.map(
                                    (t) => (
                                        <span
                                            className="pill primary-pill"
                                            key={
                                                t.id ||
                                                t._id
                                            }
                                        >
                                            #
                                            {
                                                t.number
                                            }
                                        </span>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="info">
                        <Info size={18} />

                        <span>
                            Complete the
                            Razorpay payment
                            before the booking
                            timer expires.
                        </span>
                    </div>

                    <div className="row">
                        <span className="label muted">
                            PAYMENT SESSION
                        </span>

                        <strong
                            style={{
                                color:
                                    "var(--amber)",
                            }}
                        >
                            <Countdown
                                target={
                                    booking.expiresAt
                                }
                            />
                        </strong>
                    </div>
                </div>
            </main>
        </div>
    );
}