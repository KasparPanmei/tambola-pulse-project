import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Lock, X, UserRound, Smartphone } from "lucide-react";
// ADDED: Use the app-wide popup notifications for unavailable full-sheet requests.
import { toast } from "sonner";
import api from "../lib/api.js";
import Countdown from "./Countdown.jsx";
import TicketCard from "./TicketCard.jsx";

// ADDED: Only a complete six-ticket group may be sold as a sheet.
function firstCompleteAvailableSheet(tickets) {
    const sheets = new Map();
    for (const ticket of tickets || []) {
        if (!ticket.sheetId || ticket.status !== "available") continue;
        const group = sheets.get(ticket.sheetId) || [];
        group.push(ticket);
        sheets.set(ticket.sheetId, group);
    }
    return [...sheets.values()].find((group) => group.length === 6) || null;
}

export default function CheckoutModal({ room, tickets, onClose, onPayment }) {

    const [selected, setSelected] = useState([]),
        // ADDED: Keep the player's chosen paper color for this ticket order.
        [ticketColor, setTicketColor] = useState("yellow"),
        [showColorOptions, setShowColorOptions] = useState(false),
        [name, setName] = useState(""),
        [phone, setPhone] = useState("+91 98765 43210"),
        [otp, setOtp] = useState(["", "", "", "", "", ""]),
        [sent, setSent] = useState(false),
        [verified, setVerified] = useState(false),
        [msg, setMessage] = useState(""),
        [method, setMethod] = useState("upi_qr"),
        [loading, setLoading] = useState(false),
        [showAllTickets, setShowAllTickets] = useState(false),
        // ADDED: Keep a refreshable copy of inventory so full-sheet checks use live availability.
        [availableTickets, setAvailableTickets] = useState(tickets),
        // ADDED: Prevent duplicate full-sheet inventory checks.
        [checkingFullSheet, setCheckingFullSheet] = useState(false),
        [error, setError] = useState(""),
        // CHANGED: Retain the verified profile name so an edited name cannot reuse that phone at confirmation.
        [verifiedIdentity, setVerifiedIdentity] = useState(null);
    const amount = selected.length * room.ticketPrice;
    // ADDED: Show a popup when a complete six-ticket sheet is no longer available.
    const notifyFullSheetUnavailable = () => toast.warning("No complete sheet is available", {
        description: "All six tickets in a sheet must be available together. Please try again later or choose individual tickets.",
        duration: 5000,
    });
    // ADDED: Keep the displayed ticket list synchronized with refreshed parent inventory.
    useEffect(() => setAvailableTickets(tickets), [tickets]);
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
        setSelected((current) => {
            if (current.some((ticket) => ticket._id === t._id)) {
                return current.filter((ticket) => ticket._id !== t._id);
            }
            if (current.length >= 6) return current;
            if (current.length === 5 && (!t.sheetId || current.some((ticket) => ticket.sheetId !== t.sheetId))) {
                toast.warning("Select one complete sheet", { description: "To select six tickets together, all six must belong to the same sheet." });
                return current;
            }
            return [...current, t];
        });
    };
    // MODIFIED: Recheck server inventory before allowing the six-ticket Full Sheet bundle.
    const bundle = async (n) => {
        setError("");
        if (n !== 6) {
            setSelected(availableTickets.slice(0, n));
            return;
        }
        setCheckingFullSheet(true);
        try {
            const { data } = await api.get(`/rooms/${encodeURIComponent(room.code)}`);
            const latestTickets = Array.isArray(data?.tickets) ? data.tickets : [];
            setAvailableTickets(latestTickets);
            const completeSheet = firstCompleteAvailableSheet(latestTickets);
            if (!completeSheet) {
                setSelected([]);
                notifyFullSheetUnavailable();
                return;
            }
            setSelected(completeSheet);
        } catch (e) {
            // ADDED: Preserve the warning when the last known inventory has no complete grouped sheet.
            if (!firstCompleteAvailableSheet(availableTickets)) notifyFullSheetUnavailable();
            else setError(e.response?.data?.message || "Could not check the latest ticket availability. Please try again.");
        } finally {
            setCheckingFullSheet(false);
        }
    };

    async function send() {
        try {
            setError("");
            setMessage("");

            if (!name.trim()) {
                setError("Enter your name before requesting an OTP.");
                return;
            }

            const response = await api.post("/auth/request-otp", {
                phone,
                name: name.trim(),
            });

            // Clear any old error after the server confirms success.
            setError("");
            setSent(true);
            setMessage(
                response.data?.message || "OTP sent successfully. Please check your SMS."
            );
        } catch (e) {
            setError(
                e.response?.data?.message || "Could not send OTP. Please try again."
            );
        }
    }


    async function verify() {
        try {
            setError("");
            setMessage("");

            const { data } = await api.post("/auth/verify-otp", {
                phone,
                otp: otp.join(""),
                name,
            });

            if (!data?.token || !data?.user) {
                throw new Error(
                    "The server did not return a valid verified session."
                );
            }

            localStorage.setItem("tp_token", data.token);
            localStorage.setItem("tp_user", JSON.stringify(data.user));

            setVerified(true);
            setVerifiedIdentity(data.user);

            setError("");
            setMessage("✓ OTP verified successfully");
        } catch (e) {
            setVerified(false);
            setVerifiedIdentity(null);

            setError(
                e.response?.data?.message ||
                e.message ||
                "OTP verification failed"
            );
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

        // ADDED: Do not submit six tickets unless they still represent one complete sheet.
        if (selected.length === 6 && (!selected[0]?.sheetId || selected.some((ticket) => ticket.sheetId !== selected[0].sheetId))) {
            notifyFullSheetUnavailable();
            return;
        }

        // CHANGED: Catch a changed name locally at confirmation; the server repeats this check for safety.
        if (
            verifiedIdentity?.name?.trim() &&
            verifiedIdentity.name.trim().toLocaleLowerCase() !== name.trim().toLocaleLowerCase()
        ) {
            // CHANGED: Show this identity conflict in the app-wide top notification, not inside the modal.
            toast.warning("Phone number already registered", {
                description: "This phone number is already registered under a different name. Please enter another phone number.",
                duration: 6000,
            });
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
                // ADDED: Persist the selected color through the booking API.
                ticketColor,
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
                onPayment({
                    ...booking,
                    fullName: name.trim(),
                    customerName: name.trim(),
                    name: name.trim(),
                    phoneNumber: phone.trim(),
                    customerPhone: phone.trim(),
                    phone: phone.trim(),
                });
            }, 150);


        } catch (e) {
            console.error("=== BOOKING ERROR ===");
            console.error(e);

            const status = e.response?.status;
            const serverMessage = e.response?.data?.message;

            // CHANGED: Use the same top notification if the server reports this identity conflict.
            if (serverMessage?.toLowerCase().includes("phone number is already registered under a different name")) {
                toast.warning("Phone number already registered", {
                    description: serverMessage,
                    duration: 6000,
                });
                return;
            }


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
                // ADDED: Refresh sheet groups after a conflict; offer another complete sheet if available.
                if (selected.length === 6) {
                    try {
                        const { data } = await api.get(`/rooms/${encodeURIComponent(room.code)}`);
                        const latestTickets = Array.isArray(data?.tickets) ? data.tickets : [];
                        setAvailableTickets(latestTickets);
                        const nextSheet = firstCompleteAvailableSheet(latestTickets);
                        if (!nextSheet) {
                            setSelected([]);
                            notifyFullSheetUnavailable();
                            return;
                        }
                        setSelected(nextSheet);
                        toast.warning("That sheet was just taken", { description: "We selected another complete sheet. Confirm again to reserve it." });
                        return;
                    } catch {
                        // Keep the server conflict message below if inventory could not be refreshed.
                    }
                }
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
    // CHANGED: First cap inventory to six, then show either four or that capped set.
    const firstSixAvailableTickets = availableTickets.slice(0, 6);
    const visibleTickets = showAllTickets
        ? firstSixAvailableTickets
        : firstSixAvailableTickets.slice(0, 4);
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
                            {/* MODIFIED: Show a checking state while live inventory is refreshed. */}
                            <button
                                className={`bundle ${selected.length === 6 ? "selected" : ""}`}
                                onClick={() => bundle(6)}
                                aria-disabled={checkingFullSheet}
                                disabled={checkingFullSheet}
                            >
                                {checkingFullSheet ? "Checking availability…" : "Full Sheet (6)"}
                            </button>
                        </div>
                    </div>
                    {/* ADDED: Color chooser for the seven classic Tambola ticket shades. */}
                    <div className="ticket-color-picker card pad stack">
                        <div className="row">
                            <div>
                                <div className="label">Ticket Color</div>
                                <div className="small muted">Choose a classic Tambola ticket shade</div>
                            </div>
                            <button type="button" className="btn surface ticket-color-trigger" onClick={() => setShowColorOptions((open) => !open)} aria-expanded={showColorOptions}>
                                <span className={`ticket-color-dot color-${ticketColor}`} />
                                {ticketColor[0].toUpperCase() + ticketColor.slice(1)}
                            </button>
                        </div>
                        {showColorOptions && <div className="ticket-color-options" role="group" aria-label="Ticket color">
                            {["yellow", "pink", "green", "blue", "white", "purple", "orange"].map((color) => (
                                <button key={color} type="button" className={`ticket-color-option ${ticketColor === color ? "active" : ""}`} onClick={() => { setTicketColor(color); setShowColorOptions(false); }} aria-pressed={ticketColor === color}>
                                    <span className={`ticket-color-dot color-${color}`} />{color[0].toUpperCase() + color.slice(1)}
                                </button>
                            ))}
                        </div>}
                    </div>
                    <div className="ticket-list">
                        {/* MODIFIED: Render from the refreshed available-ticket list. */}
                        {/* MODIFIED: Preview ticket cards using the currently selected color. */}
                        {visibleTickets.map((t) => (
                            <TicketCard
                                key={t._id}
                                ticket={t}
                                selected={ids.has(t._id)}
                                ticketColor={ticketColor}
                                onToggle={toggle}
                            />
                        ))}
                    </div>
                    {availableTickets.length > 4 && (
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
                                ? `Show Less (showing ${visibleTickets.length} max)`
                                : "Show More Tickets (first 6 max)"}
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
                                            setMessage("");
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

                        {error && (
                            <div className="small" style={{ color: "#ffb4ab" }}>
                                {error}
                            </div>
                        )}
                    </div>
                    <div className="card pad stack">
                        <div className="label">Instant Payment Method</div>
                        <div className="paytabs">
                            {[
                                ["upi_qr", "▦", "UPI QR"],
                                ["upi_id", "ϟ", "GPay / UPI ID"],
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
