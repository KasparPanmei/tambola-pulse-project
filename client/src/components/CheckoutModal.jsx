import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Lock, X, UserRound, Smartphone } from "lucide-react";
import api from "../lib/api.js";
import Countdown from "./Countdown.jsx";
import TicketCard from "./TicketCard.jsx";

export default function CheckoutModal({ room, tickets, onClose, onPayment }) {

    const [selected, setSelected] = useState([]),
        [name, setName] = useState(""),
        [phone, setPhone] = useState("+91 98765 43210"),
        [otp, setOtp] = useState(["", "", "", "", "", ""]),
        [sent, setSent] = useState(false),
        [verified, setVerified] = useState(false),
        [msg, setMessage] = useState(""),
        [method, setMethod] = useState("upi_qr"),
        [loading, setLoading] = useState(false),
        [showAllTickets, setShowAllTickets] = useState(false),
        [error, setError] = useState(""),
        // CHANGED: Retain the verified profile name so an edited name cannot reuse that phone at confirmation.
        [verifiedIdentity, setVerifiedIdentity] = useState(null);
    const amount = selected.length * room.ticketPrice;
    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem("tp_user") || "null");
            const token = localStorage.getItem("tp_token");

            if (user && token) {
                setName(user.name || "");
                setPhone(user.phone || "");

                // Only treat the user as verified if the stored account
                // explicitly says that the phone was verified.
                setVerified(user.phoneVerified === true);
                // CHANGED: Load the account identity alongside the verified-session state.
                setVerifiedIdentity(user);
            }
        } catch {
            localStorage.removeItem("tp_user");
            localStorage.removeItem("tp_token");
            setVerified(false);
        }
    }, []);
    const toggle = (t) => {
        setError("");
        setSelected((a) =>
            a.some((x) => x._id === t._id)
                ? a.filter((x) => x._id !== t._id)
                : a.length < 6
                    ? [...a, t]
                    : a,
        );
    };
    const bundle = (n) => setSelected(tickets.slice(0, n));
    async function send() {
        try {
            setError("");
            if (!name.trim()) {
                setError("Enter your name before requesting an OTP.");
                return;
            }
            // CHANGED: Send the booking name with the phone so the server can reject phone reuse under a different name.
            const { data } = await api.post("/auth/request-otp", { phone, name });
            setSent(true);
            setMsg(
                data.devOtp ? `Development OTP: ${data.devOtp}` : "OTP sent by SMS",
            );
        } catch (e) {
            setError(e.response?.data?.message || "Could not send OTP");
        }
    }
    async function verify() {
        try {
            const { data } = await api.post("/auth/verify-otp", {
                phone,
                otp: otp.join(""),
                name,
            });
            localStorage.setItem("tp_token", data.token);
            localStorage.setItem("tp_user", JSON.stringify(data.user));
            setVerified(true);
            // CHANGED: Remember which name was associated with the OTP-verified phone.
            setVerifiedIdentity(data.user || { name, phone });
            setMsg("✓ OTP verified automatically");
        } catch (e) {
            setError(e.response?.data?.message || "OTP verification failed");
        }
    }
    function otpChange(i, v) {
        const d = v.replace(/\D/g, "").slice(-1),
            a = [...otp];
        a[i] = d;
        setOtp(a);
        if (d && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
    }
    const confirmBooking = async () => {
        setError("");
        setMessage("");

        if (!selected.length) {
            setError("Select at least one available ticket.");
            return;
        }

        // CHANGED: Catch a changed name locally at confirmation; the server repeats this check for safety.
        if (
            verifiedIdentity?.name?.trim() &&
            verifiedIdentity.name.trim().toLocaleLowerCase() !== name.trim().toLocaleLowerCase()
        ) {
            setError("This phone number is already registered under a different name. Please enter another phone number.");
            return;
        }

        if (!name.trim()) {
            setError("Enter your full name.");
            return;
        }

        const token = localStorage.getItem("tp_token");

        if (!verified || !token) {
            setError("Verify your mobile number first.");
            return;
        }

        setLoading(true);

        try {

            setMessage("Reserving your selected tickets...");

            const holdResponse = await api.post("/bookings/hold", {
                roomCode: room.code,
                ticketIds: selected.map((ticket) => ticket._id),
            });

            console.log("Hold response:", holdResponse.data);

            const heldTickets = holdResponse.data?.tickets;

            if (!Array.isArray(heldTickets) || heldTickets.length === 0) {
                throw new Error(
                    "The server did not return any reserved tickets."
                );
            }

            setMessage("Creating your secure payment session...");

            const ticketIds = heldTickets
                .map((ticket) => ticket.id || ticket._id)
                .filter(Boolean);

            if (ticketIds.length !== selected.length) {
                throw new Error(
                    "Ticket reservation could not be completed. Please try again."
                );
            }

            const bookingResponse = await api.post("/bookings", {
                roomCode: room.code,
                ticketIds,
                paymentMethod: method,
                name: name.trim(),
            });

            console.log("Booking response:", bookingResponse.data);

            const booking = bookingResponse.data?.booking;

            if (!booking) {
                throw new Error(
                    "The server did not return a booking."
                );
            }

            if (!booking.reference) {
                throw new Error(
                    "Booking was created but no payment reference was generated."
                );
            }

            if (!booking.total && booking.total !== 0) {
                throw new Error(
                    "Booking was created but the payment amount is missing."
                );
            }

            console.log("Booking successfully created:", booking);


            setMessage("Payment session created. Opening payment...");

            setTimeout(() => {
                onPayment(booking);
            }, 150);

        } catch (e) {
            console.error("=== BOOKING ERROR ===");
            console.error(e);

            const status = e.response?.status;
            const serverMessage = e.response?.data?.message;


            if (status === 401) {
                localStorage.removeItem("tp_token");
                localStorage.removeItem("tp_user");

                setVerified(false);

                setError(
                    "Your verification session has expired. Please verify your mobile number again."
                );

                return;
            }


            if (status === 409) {
                setError(
                    serverMessage ||
                    "One of your selected tickets is no longer available. Please select another ticket."
                );

                return;
            }


            if (status >= 500) {
                setError(
                    serverMessage ||
                    "The server could not create your booking. Check the backend terminal."
                );

                return;
            }

            if (!e.response) {
                setError(
                    "Cannot connect to the backend. Make sure MongoDB and the Express server are running."
                );

                return;
            }

            setError(
                serverMessage ||
                e.message ||
                "Could not create booking."
            );

        } finally {
            setLoading(false);
        }
    };
    const ids = useMemo(() => new Set(selected.map((t) => t._id)), [selected]);
    return (
        <div className="overlay">
            <div className="modal">
                <div className="mh">
                    <div className="row">
                        <div className="gap">
                            <span className="pill primary-pill">#{room.code}</span>
                            <span className="pill amber">
                                <Clock3 size={13} />
                                <Countdown target={new Date(Date.now() + 23 * 60000 + 48000)} />
                            </span>
                        </div>
                        <button className="icon-btn" onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>
                    <div className="row" style={{ marginTop: 8 }}>
                        <div>
                            <div className="section-title">Select Available Tickets</div>
                            <div className="small muted">
                                Instant booking with digital claim stamp
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div className="label muted">Single Price</div>
                            <strong style={{ color: "var(--amber)", fontSize: 20 }}>
                                ₹{room.ticketPrice}
                                <span className="small muted">/-</span>
                            </strong>
                        </div>
                    </div>
                    <div className="steps">
                        <div className="step active">
                            <span className="stepnum">1</span>Tickets
                        </div>
                        <div className="step active">
                            <span className="stepnum">2</span>Auth
                        </div>
                        <div className="step">
                            <span className="stepnum">3</span>Pay
                        </div>
                    </div>
                </div>
                <div className="mb stack">
                    <div className="stack">
                        <div className="label muted">Quick Select Bundles</div>
                        <div className="bundle-grid">
                            {[1, 2].map((n) => (
                                <button
                                    key={n}
                                    className={`bundle ${selected.length === n ? "selected" : ""}`}
                                    onClick={() => bundle(n)}
                                >
                                    {selected.length === n && <Check size={14} />} {n} Ticket
                                    {n > 1 ? "s" : ""}
                                </button>
                            ))}
                            <button
                                className={`bundle ${selected.length === 6 ? "selected" : ""}`}
                                onClick={() => bundle(6)}
                            >
                                Full Sheet (6)
                            </button>
                        </div>
                    </div>
                    <div className="ticket-list">
                        {(showAllTickets ? tickets : tickets.slice(0, 4)).map((t) => (
                            <TicketCard
                                key={t._id}
                                ticket={t}
                                selected={ids.has(t._id)}
                                onToggle={toggle}
                            />
                        ))}
                    </div>
                    {tickets.length > 4 && (
                        <button
                            type="button"
                            className="btn surface"
                            onClick={() => setShowAllTickets((prev) => !prev)}
                            style={{
                                width: "100%",
                                marginTop: 10,
                            }}
                        >
                            {showAllTickets
                                ? "Show Less"
                                : `Show More Tickets (${tickets.length - 4})`}
                        </button>
                    )}
                    <div className="card pad stack">
                        <div className="row">
                            <div className="label">Player Contact & Auth</div>
                            <span className="pill green">Auto-Sync On</span>
                        </div>
                        <div className="field">
                            <label className="label muted">Full Name</label>
                            <div style={{ position: "relative" }}>
                                <UserRound
                                    size={16}
                                    className="muted"
                                    style={{ position: "absolute", left: 10, top: 13 }}
                                />
                                <input
                                    className="input"
                                    style={{ paddingLeft: 34 }}
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="Enter Full Name"
                                />
                            </div>
                        </div>
                        <div className="field">
                            <label className="label muted">Mobile Number (SMS Tickets)</label>
                            <div style={{ display: "flex", gap: 8 }}>
                                <div style={{ position: "relative", flex: 1 }}>
                                    <Smartphone
                                        size={16}
                                        className="muted"
                                        style={{ position: "absolute", left: 10, top: 13 }}
                                    />
                                    <input
                                        className="input"
                                        type="tel"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        style={{ paddingLeft: 34 }}
                                        value={phone}
                                        onChange={(e) => {
                                            setPhone(e.target.value);
                                            setVerified(false);
                                            setVerifiedIdentity(null);
                                            setSent(false);
                                            setOtp(["", "", "", "", "", ""]);
                                            setError("");
                                        }}
                                    />
                                </div>
                                {verified && (
                                    <span style={{ color: "var(--green)", alignSelf: "center" }}>
                                        ✓
                                    </span>
                                )}
                            </div>
                        </div>
                        {!verified && (
                            <>
                                <button className="btn surface" onClick={send} disabled={sent}>
                                    {sent ? "OTP Sent" : "Send OTP"}
                                </button>
                                {sent && (
                                    <div className="stack">
                                        <div className="row">
                                            <label className="label muted">Enter 6-Digit OTP</label>
                                            <button
                                                className="btn ghost"
                                                style={{ minHeight: 24, padding: 0 }}
                                                onClick={send}
                                            >
                                                Resend OTP
                                            </button>
                                        </div>
                                        <div className="otpgrid">
                                            {otp.map((v, i) => (
                                                <input
                                                    id={`otp-${i}`}
                                                    key={i}
                                                    className="otp"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={v}
                                                    onChange={(e) => otpChange(i, e.target.value)}
                                                />
                                            ))}
                                        </div>
                                        <button className="btn primary" onClick={verify}>
                                            Verify OTP
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                        {verified && (
                            <div className="small" style={{ color: "var(--green)" }}>
                                ✓ OTP verified automatically
                            </div>
                        )}
                        {msg && (
                            <div className="small" style={{ color: "var(--green)" }}>
                                {msg}
                            </div>
                        )}
                    </div>
                    <div className="card pad stack">
                        <div className="label">Instant Payment Method</div>
                        <div className="paytabs">
                            {[
                                ["upi_qr", "▦", "UPI QR"],
                                ["upi_id", "ϟ", "GPay / UPI ID"],
                                ["card", "▣", "Cards/Net"],
                            ].map(([id, icon, l]) => (
                                <button
                                    key={id}
                                    className={`paytab ${method === id ? "active" : ""}`}
                                    onClick={() => setMethod(id)}
                                >
                                    <span>{icon}</span>
                                    <span>{l}</span>
                                </button>
                            ))}
                        </div>
                        <div className="summary">
                            <div className="sumline">
                                <span>
                                    {selected.length} Ticket{selected.length !== 1 ? "s" : ""} × ₹
                                    {room.ticketPrice}
                                </span>
                                <strong>₹{amount}</strong>
                            </div>
                            <div className="sumline">
                                <span>Convenience & Platform Fee</span>
                                <strong style={{ color: "var(--green)" }}>FREE</strong>
                            </div>
                            <div className="sumline total">
                                <span>Total Payable</span>
                                <strong style={{ color: "var(--amber)", fontSize: 18 }}>
                                    ₹{amount}
                                </strong>
                            </div>
                        </div>
                    </div>
                    {error && (
                        <div className="small" style={{ color: "#ffb4ab" }}>
                            {error}
                        </div>
                    )}
                </div>
                <div className="mf stack">
                    <button className="btn primary" onClick={confirmBooking} disabled={loading}>
                        <Lock size={19} />
                        {loading
                            ? "Creating secure booking..."
                            : `Confirm Booking & Pay ₹${amount}`}
                    </button>
                    <div
                        className="label muted"
                        style={{ textAlign: "center", fontSize: 9, letterSpacing: ".05em" }}
                    >
                        256-Bit SSL Encrypted • Automated Ticket Assignment • Instant SMS
                    </div>
                </div>
            </div>
        </div>
    );
}
