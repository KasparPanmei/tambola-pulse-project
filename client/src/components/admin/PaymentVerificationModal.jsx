import { useEffect, useState } from "react";
import {
    CheckCircle2,
    Clock3,
    ExternalLink,
    LoaderCircle,
    ShieldCheck,
    X,
    XCircle,
} from "lucide-react";

function money(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
}

function dateTime(value) {
    if (!value) return "Not provided";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "Not provided"
        : date.toLocaleString("en-IN");
}

export default function PaymentVerificationModal({
    open,
    bookings = [],
    onClose,
    onVerify,
    onReject,
    busyReference = "",
}) {
    const [selected, setSelected] = useState(null);
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (!open) {
            setSelected(null);
            setReason("");
        }
    }, [open]);

    if (!open) return null;

    const pending = bookings.filter((booking) =>
        booking.manualPaymentSubmitted === true &&
        booking.status === "pending" &&
        booking.paymentStatus === "pending"
    );

    const current = pending.find(
        (booking) => booking.reference === selected
    );

    return (
        <div
            className="payment-review-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <section
                className="payment-review-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="payment-review-title"
            >
                <header className="payment-review-header">
                    <div>
                        <span className="payment-review-eyebrow">
                            ADMIN DESK / PAYMENTS
                        </span>
                        <h2 id="payment-review-title">
                            Payment verification
                        </h2>
                        <p>
                            Review submitted payments before confirming
                            tickets.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="payment-review-close"
                        onClick={onClose}
                        aria-label="Close verification modal"
                    >
                        <X size={20} />
                    </button>
                </header>

                <div className="payment-review-count">
                    <Clock3 size={18} />
                    <span>
                        <strong>{pending.length}</strong>{" "}
                        payment{pending.length === 1 ? "" : "s"} awaiting review
                    </span>
                </div>

                <div className="payment-review-body">
                    <div className="payment-review-list">
                        {pending.length === 0 ? (
                            <div className="payment-review-empty">
                                <CheckCircle2 size={34} />
                                <strong>All caught up</strong>
                                <p>
                                    No submitted payments are awaiting
                                    verification.
                                </p>
                            </div>
                        ) : (
                            pending.map((booking) => (
                                <button
                                    type="button"
                                    key={booking.reference}
                                    className={
                                        "payment-review-item " +
                                        (selected === booking.reference
                                            ? "selected"
                                            : "")
                                    }
                                    onClick={() =>
                                        setSelected(booking.reference)
                                    }
                                >
                                    <div>
                                        <strong>{booking.reference}</strong>
                                        <span>
                                            {booking.user?.name ||
                                                booking.name ||
                                                "Player"}
                                        </span>
                                        <small>
                                            Submitted{" "}
                                            {dateTime(booking.paymentSubmittedAt)}
                                        </small>
                                    </div>

                                    <div className="payment-review-item-right">
                                        <strong>
                                            {money(booking.total ?? booking.amount)}
                                        </strong>
                                        <span>
                                            {(booking.tickets || []).length} ticket(s)
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="payment-review-details">
                        {!current ? (
                            <div className="payment-review-placeholder">
                                <ShieldCheck size={32} />
                                <strong>Select a booking</strong>
                                <p>
                                    Review its details before approving or
                                    rejecting the payment.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="payment-review-detail-title">
                                    <div>
                                        <span>BOOKING REFERENCE</span>
                                        <h3>{current.reference}</h3>
                                    </div>
                                    <span className="payment-review-pending">
                                        Pending
                                    </span>
                                </div>

                                <div className="payment-review-amount">
                                    <span>Amount to verify</span>
                                    <strong>
                                        {money(current.total ?? current.amount)}
                                    </strong>
                                </div>

                                <dl className="payment-review-dl">
                                    <div>
                                        <dt>Player</dt>
                                        <dd>
                                            {current.user?.name ||
                                                current.name ||
                                                "Not provided"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Payment method</dt>
                                        <dd>
                                            {current.paymentMethod || "UPI"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>UPI transaction ID</dt>
                                        <dd>
                                            {current.upiReference || "Not provided"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Submitted at</dt>
                                        <dd>
                                            {dateTime(current.paymentSubmittedAt)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Ticket numbers</dt>
                                        <dd>
                                            {(current.tickets || [])
                                                .map((ticket) =>
                                                    ticket.number ?? ticket
                                                )
                                                .join(", ") || "Not provided"}
                                        </dd>
                                    </div>
                                </dl>

                                {current.paymentScreenshotUrl && (
                                    <a
                                        className="payment-review-proof"
                                        href={current.paymentScreenshotUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <ExternalLink size={16} />
                                        Open payment screenshot
                                    </a>
                                )}

                                <div className="payment-review-warning">
                                    <ShieldCheck size={18} />
                                    <p>
                                        Verify the actual transaction in your
                                        receiving UPI app or bank account.
                                        A submission or screenshot alone is
                                        not proof of payment.
                                    </p>
                                </div>

                                <label
                                    className="payment-review-label"
                                    htmlFor="payment-rejection-reason"
                                >
                                    Rejection reason (required to reject)
                                </label>
                                <textarea
                                    id="payment-rejection-reason"
                                    value={reason}
                                    onChange={(event) =>
                                        setReason(event.target.value)
                                    }
                                    placeholder="e.g. Payment not received or amount does not match"
                                    rows={3}
                                />

                                <div className="payment-review-actions">
                                    <button
                                        type="button"
                                        className="payment-review-reject"
                                        disabled={
                                            !!busyReference ||
                                            reason.trim().length < 3
                                        }
                                        onClick={() =>
                                            onReject(current, reason.trim())
                                        }
                                    >
                                        {busyReference === current.reference
                                            ? <LoaderCircle size={16} />
                                            : <XCircle size={16} />}
                                        Reject
                                    </button>

                                    <button
                                        type="button"
                                        className="payment-review-approve"
                                        disabled={!!busyReference}
                                        onClick={() => onVerify(current)}
                                    >
                                        {busyReference === current.reference
                                            ? <LoaderCircle size={16} />
                                            : <CheckCircle2 size={16} />}
                                        Verify payment
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <footer className="payment-review-footer">
                    Approving confirms the booking. Rejecting should release
                    its held tickets through the backend.
                </footer>
            </section>
        </div>
    );
}
