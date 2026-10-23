import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Info,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Ticket,
} from "lucide-react";

import { QRCodeSVG } from "qrcode.react";

import api from "../lib/api.js";

import Countdown from "./Countdown.jsx";

export default function PaymentScreen({
  booking,

  onBack,

  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [upiTransactionId, setUpiTransactionId] = useState("");

  const [copied, setCopied] = useState(false);

  const [submitted, setSubmitted] = useState(
    Boolean(booking?.manualPaymentSubmitted),
  );

  const [bookingStatus, setBookingStatus] = useState(
    booking?.status || "pending",
  );

  const [paymentStatus, setPaymentStatus] = useState(
    booking?.paymentStatus || "pending",
  );

  const [rejectionReason, setRejectionReason] = useState(
    booking?.paymentRejectionReason || "",
  );

  const total = Number(booking?.total ?? booking?.amount ?? 0);

  const tickets = booking?.tickets || [];

  const reference = booking?.reference || "";

  const upiId = String(booking?.upiId || "").trim();

  const merchantName = String(booking?.merchantName || "Tambola Pulse").trim();

  const whatsappNumber = String(booking?.whatsappNumber || "").replace(
    /\D/g,
    "",
  );

  const upiUri = useMemo(() => {
    if (!upiId || !Number.isFinite(total) || total <= 0) {
      return "";
    }

    return `upi://pay?${new URLSearchParams({
      pa: upiId,

      pn: merchantName,

      am: total.toFixed(2),

      cu: "INR",

      tn: `Tambola ${reference}`,
    }).toString()}`;
  }, [upiId, merchantName, total, reference]);

  const savedUser = JSON.parse(localStorage.getItem("tp_user") || "{}");

  const customerName =
    booking?.fullName ||
    booking?.customerName ||
    booking?.name ||
    savedUser?.fullName ||
    savedUser?.name ||
    "";

  const customerPhone =
    booking?.phoneNumber ||
    booking?.customerPhone ||
    booking?.phone ||
    savedUser?.phoneNumber ||
    savedUser?.phone ||
    "";

  const whatsappMessage = useMemo(
    () =>
      `Hello Admin, I have made a UPI payment for my Tambola Pulse booking.\n\n` +
      `Full Name: ${customerName || "Not provided"}\n` +
      `Phone Number: ${customerPhone || "Not provided"}\n\n` +
      `Booking reference: ${booking?.bookingReference || booking?.reference || booking?._id || "N/A"}\n` +
      `Amount: ₹${Number(booking?.amount || 0).toFixed(2)}\n` +
      `Tickets: ${booking?.ticketIds?.length || booking?.tickets?.length || 0}\n` +
      `UPI transaction ID: Will provide in screenshot\n\n` +
      `I am sending my payment screenshot for verification.\n\n` +
      `Thank you.`,
    [booking, customerName, customerPhone],
  );

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
    : "";

  useEffect(() => {
    if (!reference) return undefined;

    let active = true;

    const refreshStatus = async () => {
      try {
        const { data } = await api.get(
          `/bookings/${encodeURIComponent(reference)}/status`,
        );

        if (!active) return;

        const current = data.booking || data;

        setBookingStatus(current.status || "pending");

        setPaymentStatus(current.paymentStatus || "pending");

        setSubmitted(Boolean(current.manualPaymentSubmitted));

        setRejectionReason(current.paymentRejectionReason || "");

        if (
          current.status === "confirmed" &&
          current.paymentStatus === "paid"
        ) {
          onSuccess?.();
        }
      } catch (e) {
        if (e.response?.status !== 404) {
          console.error(
            "Unable to refresh booking status:",

            e,
          );
        }
      }
    };

    refreshStatus();

    const interval = window.setInterval(
      refreshStatus,

      5000,
    );

    return () => {
      active = false;

      window.clearInterval(interval);
    };
  }, [reference, onSuccess]);

  async function copyUpiId() {
    setError("");

    setCopied(false);

    try {
      await navigator.clipboard.writeText(upiId);

      setCopied(true);
    } catch {
      setError(
        "Unable to copy automatically. Please select and copy the UPI ID manually.",
      );
    }
  }

  async function submitPaymentConfirmation() {
    setError("");

    if (!reference) {
      setError("Booking reference is missing.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post(
        `/bookings/${encodeURIComponent(reference)}/submit-manual-payment`,
        {
          upiTransactionId: upiTransactionId.trim(),
        },
      );

      setSubmitted(true);
      setBookingStatus(data.booking?.status || data.status || "pending");
      setPaymentStatus(data.booking?.paymentStatus || "pending");
      setError("");
    } catch (e) {
      setError(
        e.response?.data?.message ||
        "Unable to submit payment details. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (bookingStatus === "confirmed" && paymentStatus === "paid") {
    return (
      <div className="app">
        <main className="page qrpage">
          <div
            className="card pad stack"
            style={{
              marginTop: 40,

              textAlign: "center",

              alignItems: "center",
            }}
          >
            <CheckCircle2 size={52} color="var(--green)" />

            <div className="section-title">Payment Verified!</div>

            <div className="muted">
              Your booking has been approved by the administrator. You can now
              enter the GameRoom.
            </div>

            <span className="pill green">{reference}</span>

            <button
              type="button"
              className="btn primary"
              onClick={() => onSuccess?.()}
            >
              Enter GameRoom
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (
    bookingStatus === "cancelled" ||
    bookingStatus === "expired" ||
    paymentStatus === "failed"
  ) {
    return (
      <div className="app">
        <main className="page qrpage">
          <button type="button" className="btn ghost" onClick={onBack}>
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="card pad stack">
            <Info size={40} color="var(--amber)" />

            <div className="section-title">Booking Not Active</div>

            <div className="muted">
              {rejectionReason ||
                "This booking has expired or was rejected. Please contact the administrator if you believe this is incorrect."}
            </div>

            <span className="pill">{reference}</span>

            <button type="button" className="btn primary" onClick={onBack}>
              Return to Tickets
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <main className="page qrpage">
        <button
          type="button"
          className="btn ghost"
          style={{
            justifyContent: "flex-start",

            paddingLeft: 0,
          }}
          onClick={onBack}
          disabled={loading || submitted}
        >
          <ArrowLeft size={18} />
          Back to Checkout
        </button>

        <div className="card pad stack">
          <div className="row">
            <div>
              <div className="section-title">UPI Payment</div>

              <div className="small muted">
                Pay manually and submit for verification
              </div>
            </div>

            <span className="pill">MANUAL UPI</span>
          </div>

          <div className="summary">
            <div className="sumline">
              <span>Booking reference</span>

              <strong>{reference}</strong>
            </div>

            <div className="sumline">
              <span>Selected tickets</span>

              <strong>{tickets.length}</strong>
            </div>

            <div className="sumline total">
              <span>Total payable</span>

              <strong>₹{total.toFixed(2)}</strong>
            </div>
          </div>

          {submitted ? (
            <div className="waiting stack" style={{ alignItems: "flex-start" }}>
              <Clock size={24} />

              <strong>Payment Verification Pending</strong>

              <span>
                Your payment confirmation has been submitted. Please wait while
                the administrator checks your payment.
              </span>

              <span className="small">
                You cannot enter the GameRoom until your booking is approved.
              </span>

              <span className="pill">{reference}</span>
            </div>
          ) : (
            <>
              <div className="waiting">
                <ShieldCheck size={20} />
                Pay exactly ₹{total.toFixed(2)}
                using your UPI app.
              </div>

              {upiUri && (
                <div
                  className="stack"
                  style={{
                    alignItems: "center",

                    padding: "16px 0",

                    gap: 12,
                  }}
                >
                  <div className="section-title">Scan UPI QR</div>

                  <div
                    style={{
                      background: "#ffffff",

                      padding: 14,

                      borderRadius: 14,

                      display: "inline-flex",
                    }}
                  >
                    {upiUri && (
                      <QRCodeSVG
                        value={upiUri}
                        size={220}
                        level="M"
                        includeMargin
                      />
                    )}
                  </div>

                  <div className="small muted">
                    Open GPay, PhonePe, Paytm or another compatible UPI app and
                    scan this code.
                  </div>
                </div>
              )}

              {!upiId && (
                <div className="payment-error" role="alert">
                  UPI ID is not configured. Please contact the admin.
                </div>
              )}

              <div className="summary stack">
                <div className="small muted">PAY TO</div>

                <strong>{merchantName}</strong>

                <div className="row" style={{ gap: 8 }}>
                  <strong
                    style={{
                      overflowWrap: "anywhere",
                    }}
                  >
                    {upiId || "UPI ID unavailable"}
                  </strong>

                  <button
                    type="button"
                    className="btn ghost"
                    onClick={copyUpiId}
                    disabled={!upiId}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}

                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="small muted">Amount: ₹{total.toFixed(2)}</div>
              </div>

              <div className="info">
                <Info size={18} />

                <span>
                  Verify the recipient and amount in your UPI app before paying.
                  The booking is not confirmed automatically.
                </span>
              </div>

              <div className="stack">
                <label htmlFor="upiTransactionId" className="label">
                  UPI transaction ID / UTR
                  <span className="muted"> (optional)</span>
                </label>

                <input
                  id="upiTransactionId"
                  type="text"
                  className="input"
                  value={upiTransactionId}
                  onChange={(event) => setUpiTransactionId(event.target.value)}
                  placeholder="Enter transaction reference"
                  maxLength={120}
                />
              </div>

              <a
                className="btn"
                href={whatsappUrl || undefined}
                target="\_blank"
                rel="noopener noreferrer"
                onClick={(event) => {
                  if (!whatsappUrl) {
                    event.preventDefault();

                    setError("Admin WhatsApp number is not configured.");
                  }
                }}
                style={{
                  background: "#168653",

                  color: "#ffffff",

                  textDecoration: "none",

                  justifyContent: "center",
                }}
              >
                <MessageCircle size={20} />
                Send Payment Screenshot on WhatsApp
                <ExternalLink size={16} />
              </a>

              <div className="small muted">
                WhatsApp opens a pre-filled message. You must attach and send
                your payment screenshot yourself.
              </div>

              <button
                type="button"
                className="btn primary"
                onClick={submitPaymentConfirmation}
                disabled={loading || !upiId || total <= 0}
              >
                {loading ? "Submitting..." : "Confirm Booking for Verification"}
              </button>

              {error && (
                <div className="payment-error" role="alert">
                  <strong>Unable to submit</strong>

                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="card pad stack">
          <div className="row">
            <div className="gap" style={{ alignItems: "center" }}>
              <Ticket size={20} color="var(--green)" />

              <strong>Allocated Tickets</strong>
            </div>

            <span className="pill">{tickets.length} selected</span>
          </div>

          <div
            className="gap"
            style={{
              flexWrap: "wrap",

              justifyContent: "flex-start",
            }}
          >
            {tickets.map((ticket) => (
              <span className="pill primary-pill" key={ticket.id || ticket._id}>
                #{ticket.number}
              </span>
            ))}
          </div>

          <div className="summary">
            <div className="sumline">
              <span>Ticket price</span>

              <strong>
                ₹
                {Number(
                  booking.room?.ticketPrice ??
                  total / Math.max(tickets.length, 1),
                ).toFixed(2)}
              </strong>
            </div>

            <div className="sumline">
              <span>Number of tickets</span>

              <strong>{tickets.length}</strong>
            </div>

            <div className="sumline total">
              <span>Total</span>

              <strong>₹{total.toFixed(2)}</strong>
            </div>
          </div>

          {!submitted && booking.expiresAt && (
            <div className="row">
              <span className="label muted">BOOKING EXPIRY</span>

              <strong
                style={{
                  color: "var(--amber)",
                }}
              >
                <Countdown target={booking.expiresAt} />
              </strong>
            </div>
          )}

          <div className="info">
            <Info size={18} />

            <span>
              Your booking remains pending until the administrator verifies the
              incoming payment. Never pay twice for the same booking.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
