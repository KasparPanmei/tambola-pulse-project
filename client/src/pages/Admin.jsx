import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import adminApi from "../lib/adminApi.js";
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Bell,
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Download,
    FileText,
    Gamepad2,
    History,
    Hash,
    LayoutDashboard,
    Menu,
    Pause,
    Phone,
    Play,
    RefreshCcw,
    Settings,
    ShieldCheck,
    Ticket,
    Trophy,
    UserRound,
    Users,
    X,
    XCircle,
    Zap,
} from "lucide-react";

const historyRows = [
    {
        room: "TAM-8841",
        name: "Weekend Mega Draw",
        date: "12 Sep 2026",
        jackpot: "₹14,500 jackpot",
    },
    {
        room: "TAM-8840",
        name: "Friday Night Housie",
        date: "11 Sep 2026",
        jackpot: "₹12,000 jackpot",
    },
    {
        room: "TAM-8839",
        name: "Thursday Jackpot",
        date: "10 Sep 2026",
        jackpot: "₹10,500 jackpot",
    },
];

function StatCard({ icon: Icon, label, value, detail, tone = "" }) {
    return (
        <div className="admin-stat">
            <div className={`admin-stat-icon ${tone}`}>
                <Icon size={18} />
            </div>

            <div className="admin-stat-content">
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{detail}</small>
            </div>
        </div>
    );
}

function PanelHeader({
    icon: Icon,
    title,
    description,
    tag,
}) {
    return (
        <div className="admin-panel-header">
            <div>
                <div className="admin-panel-title">
                    <Icon size={18} />
                    {title}
                </div>

                {description && <p>{description}</p>}
            </div>

            {tag && <span className="admin-panel-tag">{tag}</span>}
        </div>
    );
}

function TicketCard({ ticket }) {
    return (
        <div className="admin-ticket">
            <div className="admin-ticket-top">
                <div>
                    <div className="admin-ticket-number">
                        Ticket #{ticket.number}
                    </div>

                    <div className="admin-ticket-code">
                        {ticket.code}
                    </div>
                </div>

                <span
                    className={`admin-ticket-status ${ticket.status}`}
                >
                    {ticket.status}
                </span>
            </div>

            <div className="admin-ticket-grid">
                {ticket.grid.flatMap((row, rowIndex) =>
                    row.map((value, columnIndex) => (
                        <div
                            key={`${rowIndex}-${columnIndex}`}
                            className={`admin-ticket-cell ${value === null
                                ? "empty"
                                : "filled"
                                }`}
                        >
                            {value ?? ""}
                        </div>
                    )),
                )}
            </div>

            <div className="admin-ticket-footer">
                <span>15 NUMBERS</span>

                {ticket.status === "booked" ? (
                    <span className="admin-ticket-booked">
                        BOOKED
                    </span>
                ) : (
                    <span>READY</span>
                )}
            </div>
        </div>
    );
}

function CreateRoomPanel({ form, setForm, onSubmit, busy }) {
    function updatePrize(index, field, value) {
        setForm((current) => ({
            ...current,
            prizes: current.prizes.map((prize, prizeIndex) =>
                prizeIndex === index
                    ? {
                        ...prize,
                        [field]:
                            field === "amount" || field === "winners"
                                ? Number(value)
                                : value,
                    }
                    : prize,
            ),
        }));
    }

    return (
        <section className="admin-panel" style={{ marginTop: 24 }}>
            <PanelHeader
                icon={Settings}
                title="Create Game Room"
                description="Create the room and configure its prize structure before players join."
                tag="ROOM SETUP"
            />

            <form onSubmit={onSubmit}>
                <div
                    className="admin-generator-actions"
                    style={{
                        alignItems: "stretch",
                        flexWrap: "wrap",
                    }}
                >
                    <div className="admin-count-input" style={{ minWidth: 180 }}>
                        <span>ROOM CODE</span>
                        <input
                            value={form.code}
                            onChange={(e) =>
                                setForm((v) => ({
                                    ...v,
                                    code: e.target.value.toUpperCase(),
                                }))
                            }
                            placeholder="TAM-8842"
                            required
                        />
                    </div>

                    <div className="admin-count-input" style={{ minWidth: 260 }}>
                        <span>TITLE</span>
                        <input
                            value={form.title}
                            onChange={(e) =>
                                setForm((v) => ({
                                    ...v,
                                    title: e.target.value,
                                }))
                            }
                            placeholder="Pick Your Lucky Numbers & Win Jackpot Housie"
                            required
                        />
                    </div>

                    <div className="admin-count-input" style={{ minWidth: 160 }}>
                        <span>TICKET PRICE</span>
                        <input
                            type="number"
                            min="0"
                            value={form.ticketPrice}
                            onChange={(e) =>
                                setForm((v) => ({
                                    ...v,
                                    ticketPrice: e.target.value,
                                }))
                            }
                            required
                        />
                    </div>

                    <div className="admin-count-input" style={{ minWidth: 160 }}>
                        <span>JACKPOT</span>
                        <input
                            type="number"
                            min="0"
                            value={form.jackpot}
                            onChange={(e) =>
                                setForm((v) => ({
                                    ...v,
                                    jackpot: e.target.value,
                                }))
                            }
                            required
                        />
                    </div>

                    <div className="admin-count-input" style={{ minWidth: 160 }}>
                        <span>BALLS</span>
                        <input
                            type="number"
                            min="1"
                            max="90"
                            value={form.balls}
                            onChange={(e) =>
                                setForm((v) => ({
                                    ...v,
                                    balls: e.target.value,
                                }))
                            }
                            required
                        />
                    </div>

                    <div className="admin-count-input" style={{ minWidth: 220 }}>
                        <span>START TIME</span>
                        <input
                            type="datetime-local"
                            value={form.startsAt}
                            onChange={(e) =>
                                setForm((v) => ({
                                    ...v,
                                    startsAt: e.target.value,
                                }))
                            }
                        />
                    </div>
                </div>

                <div style={{ marginTop: 16 }}>
                    <label style={{ display: "block" }}>
                        <span
                            style={{
                                display: "block",
                                marginBottom: 8,
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                            }}
                        >
                            DESCRIPTION
                        </span>

                        <textarea
                            value={form.description}
                            onChange={(e) =>
                                setForm((v) => ({
                                    ...v,
                                    description: e.target.value,
                                }))
                            }
                            placeholder="Official weekend mega bumper draw with instant UPI automated settlements."
                            rows={3}
                            style={{
                                width: "100%",
                                resize: "vertical",
                            }}
                        />
                    </label>
                </div>

                <div className="admin-prize-config" style={{ marginTop: 24 }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 12,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    letterSpacing: "0.08em",
                                }}
                            >
                                PRIZE CONFIGURATION
                            </div>

                            <div
                                style={{
                                    marginTop: 4,
                                    fontSize: 12,
                                    opacity: 0.65,
                                }}
                            >
                                Set the payout and number of winners for this room.
                            </div>
                        </div>
                    </div>

                    <div className="admin-prize-config-list">
                        {form.prizes.map((prize, index) => (
                            <div
                                className="admin-prize-config-row"
                                key={prize.id}
                            >
                                <div className="admin-prize-config-name">
                                    <Trophy size={15} />
                                    <strong>{prize.name}</strong>
                                </div>

                                <label className="admin-prize-field">
                                    <span>AMOUNT</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={prize.amount}
                                        onChange={(e) =>
                                            updatePrize(
                                                index,
                                                "amount",
                                                e.target.value,
                                            )
                                        }
                                        required={prize.enabled}
                                    />
                                </label>

                                <label className="admin-prize-field">
                                    <span>WINNERS</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={prize.winners}
                                        onChange={(e) =>
                                            updatePrize(
                                                index,
                                                "winners",
                                                e.target.value,
                                            )
                                        }
                                        required={prize.enabled}
                                    />
                                </label>

                                <label className="admin-prize-toggle">
                                    <span>ENABLED</span>
                                    <input
                                        type="checkbox"
                                        checked={prize.enabled}
                                        onChange={(e) =>
                                            updatePrize(
                                                index,
                                                "enabled",
                                                e.target.checked,
                                            )
                                        }
                                    />
                                </label>
                            </div>
                        ))}
                    </div>

                    <div
                        className="admin-payout-footer"
                        style={{ marginTop: 14 }}
                    >
                        <span>TOTAL CONFIGURED PRIZES</span>

                        <strong>
                            ₹
                            {form.prizes
                                .filter((prize) => prize.enabled)
                                .reduce(
                                    (total, prize) =>
                                        total +
                                        Number(prize.amount || 0) *
                                        Number(prize.winners || 1),
                                    0,
                                )
                                .toLocaleString("en-IN")}
                        </strong>
                    </div>
                </div>

                <div
                    className="admin-scheduler-actions"
                    style={{ marginTop: 16 }}
                >
                    <button
                        className="admin-start-game"
                        type="submit"
                        disabled={busy}
                    >
                        <Gamepad2 size={15} />

                        {busy
                            ? "CREATING ROOM..."
                            : "CREATE ROOM"}
                    </button>
                </div>
            </form>
        </section>
    );
}


function getTicketNumbers(ticket) {
    if (!Array.isArray(ticket?.grid)) return [];
    return ticket.grid.flat().filter(
        (value) => value !== null && value !== undefined && value !== "",
    );
}

function getCalledSet(calledNumbers) {
    return new Set(
        Array.isArray(calledNumbers) ? calledNumbers.map(Number) : [],
    );
}

function getTicketValidation(ticket, calledNumbers) {
    const grid = Array.isArray(ticket?.grid) ? ticket.grid : [];
    const called = getCalledSet(calledNumbers);
    const rows = grid.map((row) => {
        const numbers = Array.isArray(row)
            ? row.filter((value) => value !== null && value !== undefined && value !== "")
            : [];
        const marked = numbers.filter((value) => called.has(Number(value))).length;
        return {
            total: numbers.length,
            marked,
            complete: numbers.length > 0 && marked === numbers.length,
        };
    });
    const allNumbers = getTicketNumbers(ticket);
    const markedTotal = allNumbers.filter((value) => called.has(Number(value))).length;
    const firstRow = grid[0] || [];
    const lastRow = grid[2] || [];
    const firstNumber = firstRow.find((value) => value !== null && value !== undefined && value !== "");
    const lastNumber = [...firstRow].reverse().find((value) => value !== null && value !== undefined && value !== "");
    const bottomFirst = lastRow.find((value) => value !== null && value !== undefined && value !== "");
    const bottomLast = [...lastRow].reverse().find((value) => value !== null && value !== undefined && value !== "");
    const corners = [firstNumber, lastNumber, bottomFirst, bottomLast].filter(
        (value) => value !== null && value !== undefined && value !== "",
    );
    const markedCorners = corners.filter((value) => called.has(Number(value))).length;
    return {
        rows,
        markedTotal,
        totalNumbers: allNumbers.length,
        fourCorners: corners.length === 4 && markedCorners === 4,
        markedCorners,
    };
}

function ClaimTicketChart({ ticket, calledNumbers = [] }) {
    const called = getCalledSet(calledNumbers);
    const grid = Array.isArray(ticket?.grid) ? ticket.grid : [];
    return (
        <div className="claim-review-ticket">
            <div className="claim-review-ticket-header">
                <div>
                    <span className="claim-review-eyebrow">TICKET CHART</span>
                    <strong>
                        {ticket?.publicCode || ticket?.code || `Ticket #${ticket?.number ?? "—"}`}
                    </strong>
                </div>
                <span className="claim-review-ticket-id">
                    <Hash size={11} />
                    {ticket?._id || "N/A"}
                </span>
            </div>
            <div className="claim-review-grid">
                {grid.flatMap((row, rowIndex) =>
                    Array.isArray(row)
                        ? row.map((value, columnIndex) => {
                            const number = value !== null && value !== undefined && value !== "";
                            const marked = number && called.has(Number(value));
                            return (
                                <div
                                    key={`${rowIndex}-${columnIndex}`}
                                    className={["claim-review-cell", !number ? "empty" : "", marked ? "called" : ""]
                                        .filter(Boolean)
                                        .join(" ")}
                                >
                                    {number ? value : ""}
                                </div>
                            );
                        })
                        : [],
                )}
            </div>
            <div className="claim-review-ticket-legend">
                <span><i className="legend-number" />Number</span>
                <span><i className="legend-called" />Called</span>
                <span><i className="legend-empty" />Empty</span>
            </div>
        </div>
    );
}

function ClaimValidationPanel({ claim, calledNumbers }) {
    const validation = getTicketValidation(claim?.ticket, calledNumbers);
    const prizeId = String(claim?.prizeId || "");
    const topLine = validation.rows[0] || { total: 5, marked: 0, complete: false };
    const middleLine = validation.rows[1] || { total: 5, marked: 0, complete: false };
    const bottomLine = validation.rows[2] || { total: 5, marked: 0, complete: false };
    const checks = [
        { label: "Early Five", value: `${Math.min(validation.markedTotal, 5)} / 5`, valid: validation.markedTotal >= 5, active: prizeId === "early-five" },
        { label: "Top Line", value: `${topLine.marked} / ${topLine.total || 5}`, valid: topLine.complete, active: prizeId === "top-line" },
        { label: "Middle Line", value: `${middleLine.marked} / ${middleLine.total || 5}`, valid: middleLine.complete, active: prizeId === "middle-line" },
        { label: "Bottom Line", value: `${bottomLine.marked} / ${bottomLine.total || 5}`, valid: bottomLine.complete, active: prizeId === "bottom-line" },
        { label: "Four Corners", value: `${validation.markedCorners} / 4`, valid: validation.fourCorners, active: prizeId === "four-corners" },
        { label: "Full House", value: `${validation.markedTotal} / ${validation.totalNumbers || 15}`, valid: validation.totalNumbers > 0 && validation.markedTotal === validation.totalNumbers, active: prizeId === "full-house" },
    ];
    return (
        <div className="claim-validation-panel">
            <div className="claim-validation-header">
                <div>
                    <strong>Winning Condition Check</strong>
                    <span>System calculation based on the numbers already called.</span>
                </div>
                <span className="claim-validation-total">{validation.markedTotal} / {validation.totalNumbers || 15}</span>
            </div>
            <div className="claim-validation-list">
                {checks.map((check) => (
                    <div
                        key={check.label}
                        className={["claim-validation-row", check.active ? "active" : "", check.valid ? "valid" : ""]
                            .filter(Boolean)
                            .join(" ")}
                    >
                        <div className="claim-validation-icon">
                            {check.valid ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
                        </div>
                        <div className="claim-validation-name">
                            <strong>{check.label}</strong>
                            {check.active && <span>CLAIMED CONDITION</span>}
                        </div>
                        <strong className="claim-validation-count">{check.value}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ClaimReviewModal({ claim, calledNumbers, balls, onClose, onVerify, onReject }) {
    if (!claim) return null;
    const status = String(claim.status || "pending").toLowerCase();
    return (
        <div
            className="claim-review-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="claim-review-modal">
                <div className="claim-review-header">
                    <div>
                        <div className="claim-review-kicker">
                            <ShieldCheck size={14} />
                            PRIZE CLAIM VERIFICATION
                        </div>
                        <h2>Review Winner Claim</h2>
                        <p>Verify the player, ticket and winning condition before approving this claim.</p>
                    </div>
                    <button type="button" className="claim-review-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="claim-review-status-row">
                    <div>
                        <span className="claim-review-prize-label">CLAIMED PRIZE</span>
                        <strong className="claim-review-prize">{claim.prizeName || "Prize"}</strong>
                    </div>
                    <span className={`claim-review-status ${status}`}>{status.toUpperCase()}</span>
                </div>

                <div className="claim-review-info-grid">
                    <div className="claim-review-info-card">
                        <div className="claim-review-info-icon"><UserRound size={16} /></div>
                        <div><span>PLAYER NAME</span><strong>{claim.user?.name || "Unknown"}</strong></div>
                    </div>
                    <div className="claim-review-info-card">
                        <div className="claim-review-info-icon"><Phone size={16} /></div>
                        <div><span>CONTACT NUMBER</span><strong>{claim.user?.phone || "N/A"}</strong></div>
                    </div>
                    <div className="claim-review-info-card">
                        <div className="claim-review-info-icon"><Ticket size={16} /></div>
                        <div><span>TICKET ID</span><strong>{claim.ticket?.publicCode || claim.ticket?.code || claim.ticket?.number || "N/A"}</strong></div>
                    </div>
                    <div className="claim-review-info-card">
                        <div className="claim-review-info-icon"><Trophy size={16} /></div>
                        <div><span>PRIZE AMOUNT</span><strong>₹{Number(claim.prizeAmount || 0).toLocaleString("en-IN")}</strong></div>
                    </div>
                </div>

                <div className="claim-review-section">
                    <div className="claim-review-section-title">
                        <div>
                            <strong>Exact Ticket Verification</strong>
                            <span>Numbers highlighted in gold have already been called.</span>
                        </div>
                        <span className="claim-review-ball-count">{calledNumbers.length} / {balls || 90} CALLED</span>
                    </div>
                    <ClaimTicketChart ticket={claim.ticket} calledNumbers={calledNumbers} />
                </div>

                <div className="claim-review-section">
                    <ClaimValidationPanel claim={claim} calledNumbers={calledNumbers} />
                </div>

                <div className="claim-review-validation">
                    <div className="claim-review-validation-icon"><CheckCircle2 size={17} /></div>
                    <div>
                        <strong>Claim submission record</strong>
                        <span>Submitted {claim.claimedAt ? new Date(claim.claimedAt).toLocaleString("en-IN") : "N/A"}</span>
                    </div>
                    <div className="claim-review-validation-value">
                        {status === "pending" ? "PENDING REVIEW" : status.toUpperCase()}
                    </div>
                </div>

                {status === "pending" ? (
                    <div className="claim-review-actions">
                        <button type="button" className="claim-review-reject" onClick={() => onReject(claim._id)}>
                            <XCircle size={16} />
                            Reject Claim
                        </button>
                        <button type="button" className="claim-review-verify" onClick={() => onVerify(claim._id)}>
                            <CheckCircle2 size={16} />
                            Verify Winner
                        </button>
                    </div>
                ) : (
                    <div className="claim-review-closed">
                        {status === "verified" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        Claim status: <strong>{status.toUpperCase()}</strong>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Admin() {
    const navigate = useNavigate();

    useEffect(() => {
        try {
            const token = localStorage.getItem("tp_admin_token");
            const user = JSON.parse(
                localStorage.getItem("tp_admin_user") || "null",
            );

            if (!token || user?.role !== "admin") {
                navigate("/", {
                    replace: true,
                });
            }
        } catch {
            localStorage.removeItem("tp_admin_token");
            localStorage.removeItem("tp_admin_user");

            navigate("/", {
                replace: true,
            });
        }
    }, [navigate]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] =
        useState("overview");

    const [roomCode, setRoomCode] = useState(() => localStorage.getItem("tp_admin_room_code") || "");
    const [room, setRoom] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [payments, setPayments] = useState([]);
    const [creatingRoom, setCreatingRoom] = useState(false);
    const currentBall = room?.currentNumber ?? null;

    const calledBalls = Array.isArray(room?.calledNumbers)
        ? room.calledNumbers
        : [];
    const [winnerClaims, setWinnerClaims] =
        useState([]);

    const [winnerAlert, setWinnerAlert] =
        useState(null);

    const seenClaimIds =
        useRef(new Set());

    const claimsInitialized =
        useRef(false);
    async function verifyClaim(claimId) {
        try {
            const { data } = await adminApi.post(`/admin/claims/${claimId}/verify`);
            const updatedClaim = data?.claim;
            setWinnerClaims((current) =>
                current.map((claim) =>
                    String(claim._id) === String(claimId)
                        ? { ...claim, ...(updatedClaim || {}), status: "verified" }
                        : claim,
                ),
            );
            setWinnerAlert((current) =>
                current && String(current._id) === String(claimId)
                    ? { ...current, ...(updatedClaim || {}), status: "verified" }
                    : current,
            );
            setLastAction("Winner verified successfully.");
            await loadAdminData({ silent: true });
        } catch (error) {
            console.error("Verify winner error:", error);
            setLastAction(error.response?.data?.message || "Unable to verify winner.");
        }
    }

    async function rejectClaim(claimId) {
        try {
            const { data } = await adminApi.post(`/admin/claims/${claimId}/reject`);
            const updatedClaim = data?.claim;
            setWinnerClaims((current) =>
                current.map((claim) =>
                    String(claim._id) === String(claimId)
                        ? { ...claim, ...(updatedClaim || {}), status: "rejected" }
                        : claim,
                ),
            );
            setWinnerAlert((current) =>
                current && String(current._id) === String(claimId)
                    ? { ...current, ...(updatedClaim || {}), status: "rejected" }
                    : current,
            );
            setLastAction("Prize claim rejected.");
            await loadAdminData({ silent: true });
        } catch (error) {
            console.error("Reject winner error:", error);
            setLastAction(error.response?.data?.message || "Unable to reject claim.");
        }
    }
    const [roomForm, setRoomForm] = useState({
        code: "",
        title: "Pick Your Lucky Numbers & Win Jackpot Housie",
        description: "Official weekend mega bumper draw with instant UPI automated settlements.",
        startsAt: "",
        ticketPrice: 50,
        jackpot: 15000,
        balls: 90,
        prizes: [
            {
                id: "early-five",
                name: "Early Five",
                shortName: "Early 5",
                amount: 1000,
                reward: "₹1,000",
                detail: "First five marks on your ticket",
                accent: "coral",
                winners: 1,
                enabled: true,
            },
            {
                id: "top-line",
                name: "Top Line",
                shortName: "Top line",
                amount: 2000,
                reward: "₹2,000",
                detail: "Complete the top row",
                accent: "gold",
                winners: 1,
                enabled: true,
            },
            {
                id: "middle-line",
                name: "Middle Line",
                shortName: "Middle line",
                amount: 2000,
                reward: "₹2,000",
                detail: "Complete the middle row",
                accent: "mint",
                winners: 1,
                enabled: true,
            },
            {
                id: "bottom-line",
                name: "Bottom Line",
                shortName: "Bottom line",
                amount: 2000,
                reward: "₹2,000",
                detail: "Complete the bottom row",
                accent: "lilac",
                winners: 1,
                enabled: true,
            },
            {
                id: "four-corners",
                name: "Four Corners",
                shortName: "4 corners",
                amount: 3000,
                reward: "₹3,000",
                detail: "Mark the outside corners",
                accent: "gold",
                winners: 1,
                enabled: true,
            },
            {
                id: "full-house",
                name: "Full House",
                shortName: "Full house",
                amount: 5000,
                reward: "₹5,000",
                detail: "Mark all 15 numbers",
                accent: "gold",
                winners: 1,
                enabled: true,
            },
        ],
    });
    const [dashboardStats, setDashboardStats] = useState({
        totalTickets: 0,
        availableTickets: 0,
        bookedTickets: 0,
        heldTickets: 0,
        totalBookings: 0,
        revenue: 0,
    });
    const [loading, setLoading] = useState(true);
    const [ticketCount, setTicketCount] = useState(100);
    const [cadence, setCadence] = useState(5);

    const gameState =
        room?.status === "live"
            ? "live"
            : room?.status === "closed"
                ? "terminated"
                : "upcoming";



    const [notifications, setNotifications] =
        useState(true);

    const [lastAction, setLastAction] =
        useState("");

    const totalGenerated = dashboardStats.totalTickets;
    const availableTickets = dashboardStats.availableTickets;
    const bookedTickets = dashboardStats.bookedTickets;
    const heldTickets = dashboardStats.heldTickets;
    const totalBookings = dashboardStats.totalBookings;
    const totalRevenue = dashboardStats.revenue;

    const loadAdminData = async ({ silent = false } = {}) => {
        if (!roomCode) {
            setRoom(null); setTickets([]); setBookings([]); setPayments([]);
            setDashboardStats({ totalTickets: 0, availableTickets: 0, bookedTickets: 0, heldTickets: 0, totalBookings: 0, revenue: 0 });
            setLoading(false); return;
        }
        const claimsResponse =
            await adminApi.get(
                `/admin/rooms/${roomCode}/claims`,
            );

        const claims =
            claimsResponse.data.claims || [];

        setWinnerClaims(claims);
        if (claimsInitialized.current) {
            const newClaim =
                claims.find(
                    (claim) =>
                        claim.status ===
                        "pending" &&
                        !seenClaimIds.current.has(
                            claim._id,
                        ),
                );

            if (
                newClaim &&
                notifications
            ) {
                setWinnerAlert(newClaim);
            }
        }

        claims.forEach((claim) => {
            seenClaimIds.current.add(
                claim._id,
            );
        });

        claimsInitialized.current = true;
        if (!silent) setLoading(true);
        try {
            const [roomResponse, ticketsResponse, bookingsResponse, paymentsResponse] = await Promise.all([
                adminApi.get(`/rooms/${encodeURIComponent(roomCode)}`),
                adminApi.get(`/admin/tickets?room=${encodeURIComponent(roomCode)}`),
                adminApi.get(`/admin/bookings?room=${encodeURIComponent(roomCode)}`),
                adminApi.get(`/admin/payments?room=${encodeURIComponent(roomCode)}`).catch(() => ({ data: { payments: [] } })),
            ]);
            const nextRoom = roomResponse.data.room;
            const nextTickets = (ticketsResponse.data.tickets || []).map((ticket) => ({ ...ticket, code: ticket.publicCode || ticket.code }));
            const nextBookings = bookingsResponse.data.bookings || [];
            const nextPayments = paymentsResponse.data.payments || [];
            setRoom(nextRoom); setTickets(nextTickets); setBookings(nextBookings); setPayments(nextPayments);
            const available = nextTickets.filter((x) => x.status === "available").length;
            const booked = nextTickets.filter((x) => x.status === "booked").length;
            const held = nextTickets.filter((x) => x.status === "held").length;
            const revenue = nextBookings.filter((x) => x.paymentStatus === "paid").reduce((sum, x) => sum + Number(x.total ?? x.amount ?? 0), 0);
            setDashboardStats({ totalTickets: nextTickets.length, availableTickets: available, bookedTickets: booked, heldTickets: held, totalBookings: nextBookings.length, revenue });
        } catch (error) {
            console.error("Admin data loading error:", error);
            if (error.response?.status === 404) {
                setRoom(null); setTickets([]); setBookings([]); setPayments([]);
                setLastAction(`Room ${roomCode} was not found. Create/select a valid room.`);
            } else {
                setLastAction(error.response?.data?.message || "Unable to synchronize AdminDesk with the server.");
            }
        } finally { setLoading(false); }
    };
    useEffect(() => {
        loadAdminData();

        if (!roomCode) {
            return undefined;
        }

        const interval =
            window.setInterval(
                () =>
                    loadAdminData({
                        silent: true,
                    }),
                1000,
            );

        return () =>
            window.clearInterval(
                interval,
            );
    }, [roomCode]);

    async function handleCreateRoom(event) {
        event.preventDefault();
        setCreatingRoom(true);
        setLastAction("");

        try {
            const payload = {
                ...roomForm,
                code: roomForm.code.trim().toUpperCase(),
                ticketPrice: Number(roomForm.ticketPrice),
                jackpot: Number(roomForm.jackpot),
                balls: Number(roomForm.balls),
                startsAt: roomForm.startsAt || undefined,
                prizes: roomForm.prizes.map((prize) => ({
                    ...prize,
                    amount: Number(prize.amount),
                    winners: Number(prize.winners),
                })),
            };

            const { data } = await adminApi.post(
                "/admin/rooms",
                payload,
            );

            const createdRoom = data.room;
            const code = createdRoom.code;

            localStorage.setItem(
                "tp_admin_room_code",
                code,
            );

            setRoomCode(code);
            setRoom(createdRoom);

            setLastAction(
                `Room ${code} created successfully.`,
            );

            setRoomForm({
                code: "",
                title: "Pick Your Lucky Numbers & Win Jackpot Housie",
                description:
                    "Official weekend mega bumper draw with instant UPI automated settlements.",
                startsAt: "",
                ticketPrice: 50,
                jackpot: 15000,
                balls: 90,
                prizes: [
                    {
                        id: "early-five",
                        name: "Early Five",
                        shortName: "Early 5",
                        amount: 1000,
                        reward: "₹1,000",
                        detail: "First five marks on your ticket",
                        accent: "coral",
                        winners: 1,
                        enabled: true,
                    },
                    {
                        id: "top-line",
                        name: "Top Line",
                        shortName: "Top line",
                        amount: 2000,
                        reward: "₹2,000",
                        detail: "Complete the top row",
                        accent: "gold",
                        winners: 1,
                        enabled: true,
                    },
                    {
                        id: "middle-line",
                        name: "Middle Line",
                        shortName: "Middle line",
                        amount: 2000,
                        reward: "₹2,000",
                        detail: "Complete the middle row",
                        accent: "mint",
                        winners: 1,
                        enabled: true,
                    },
                    {
                        id: "bottom-line",
                        name: "Bottom Line",
                        shortName: "Bottom line",
                        amount: 2000,
                        reward: "₹2,000",
                        detail: "Complete the bottom row",
                        accent: "lilac",
                        winners: 1,
                        enabled: true,
                    },
                    {
                        id: "four-corners",
                        name: "Four Corners",
                        shortName: "4 corners",
                        amount: 3000,
                        reward: "₹3,000",
                        detail: "Mark the outside corners",
                        accent: "gold",
                        winners: 1,
                        enabled: true,
                    },
                    {
                        id: "full-house",
                        name: "Full House",
                        shortName: "Full house",
                        amount: 5000,
                        reward: "₹5,000",
                        detail: "Mark all 15 numbers",
                        accent: "gold",
                        winners: 1,
                        enabled: true,
                    },
                ],
            });
        } catch (error) {
            console.error(
                "Create room error:",
                error,
            );

            setLastAction(
                error.response?.data?.message ||
                "Unable to create room.",
            );
        } finally {
            setCreatingRoom(false);
        }
    }
    function clearSelectedRoom() {
        const confirmed = window.confirm(
            "Start a new AdminDesk session? This only deselects the current room; it does not delete the room or its tickets."
        );

        if (!confirmed) return;

        localStorage.removeItem("tp_admin_room_code");
        setRoomCode("");
        setRoom(null);
        setTickets([]);
        setBookings([]);
        setPayments([]);
        setDashboardStats({
            totalTickets: 0,
            availableTickets: 0,
            bookedTickets: 0,
            heldTickets: 0,
            totalBookings: 0,
            revenue: 0,
        });
        setLastAction("Selected room cleared. The Create Room section remains available.");
    }

    function scrollToSection(id) {
        setActiveSection(id);
        setSidebarOpen(false);

        document
            .getElementById(id)
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
    }
    async function drawBall() {
        if (!roomCode) {
            setLastAction(
                "Select a room before drawing a ball.",
            );
            return;
        }

        if (room?.status !== "live") {
            setLastAction(
                "Game must be live before drawing a ball.",
            );
            return;
        }

        try {
            const { data } =
                await adminApi.post(
                    `/admin/rooms/${encodeURIComponent(
                        roomCode,
                    )}/draw`,
                );

            const updatedRoom =
                data?.room;

            if (!updatedRoom) {
                throw new Error(
                    "Server did not return the updated room.",
                );
            }

            /*
             * Server is authoritative.
             */
            setRoom(updatedRoom);

            setLastAction(
                `Ball ${updatedRoom.currentNumber} called`,
            );

            await loadAdminData({
                silent: true,
            });
        } catch (error) {
            console.error(
                "Draw ball error:",
                error,
            );

            setLastAction(
                error.response?.data
                    ?.message ||
                error.message ||
                "Unable to draw ball.",
            );
        }
    }
    async function startGame() {
        try {
            const { data } = await adminApi.post(
                `/admin/rooms/${encodeURIComponent(roomCode)}/start`,
            );

            setRoom(data.room);
            setLastAction("Game started");
            await loadAdminData({ silent: true });
        } catch (error) {
            setLastAction(
                error.response?.data?.message ||
                "Failed to start game",
            );
        }
    }

    async function toggleGame() {
        try {
            if (gameState === "live") {
                const { data } = await adminApi.post(
                    `/admin/rooms/${encodeURIComponent(roomCode)}/pause`,
                );
                setRoom(data.room);
                setLastAction("Game paused");
            } else {
                const { data } = await adminApi.post(
                    `/admin/rooms/${encodeURIComponent(roomCode)}/start`,
                );
                setRoom(data.room);
                setLastAction("Game resumed");
            }

            await loadAdminData({ silent: true });
        } catch (error) {
            setLastAction(
                error.response?.data?.message ||
                "Failed to update game state",
            );
        }
    }



    async function terminateGame() {
        try {
            const { data } = await adminApi.post(
                `/admin/rooms/${encodeURIComponent(roomCode)}/terminate`,
            );

            setRoom(data.room);
            setLastAction("Game terminated");
            await loadAdminData({ silent: true });
        } catch (error) {
            setLastAction(
                error.response?.data?.message ||
                "Failed to terminate game",
            );
        }
    }

    async function resetRoom() {
        if (!roomCode) return;
        try {
            const { data } = await adminApi.post(`/admin/rooms/${encodeURIComponent(roomCode)}/reset`);
            setRoom(data.room); setLastAction("Room reset successfully."); await loadAdminData({ silent: true });
        } catch (error) { setLastAction(error.response?.data?.message || "Failed to reset room."); }
    }

    async function generateTickets() {
        if (!roomCode) { setLastAction("Create a room before generating tickets."); return; }
        const requestedCount = Number(ticketCount);
        if (!Number.isInteger(requestedCount) || requestedCount < 1 || requestedCount > 1000) { setLastAction("Ticket count must be between 1 and 1000."); return; }
        try {
            const { data } = await adminApi.post("/admin/tickets/generate", { roomCode, count: requestedCount });
            setLastAction(data.message || `${requestedCount} tickets generated successfully.`); await loadAdminData({ silent: true });
        } catch (error) { console.error("Generate tickets error:", error); setLastAction(error.response?.data?.message || "Failed to generate tickets."); }
    }

    if (loading) {
        return (
            <div className="admin-page">
                <main className="admin-main">
                    <div className="admin-content">
                        <div className="admin-panel" style={{ marginTop: 24 }}>
                            <PanelHeader
                                icon={RefreshCcw}
                                title="Synchronizing AdminDesk"
                                description="Loading room, ticket, booking and payment data from the server."
                                tag="SYNC"
                            />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <ClaimReviewModal
                claim={winnerAlert}
                calledNumbers={calledBalls}
                balls={room?.balls}
                onClose={() => setWinnerAlert(null)}
                onVerify={verifyClaim}
                onReject={rejectClaim}
            />

            {sidebarOpen && (
                <button
                    className="admin-sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                />
            )}

            {/* SIDEBAR */}
            <aside
                className={`admin-sidebar ${sidebarOpen ? "open" : ""
                    }`}
            >
                <div className="admin-brand">
                    <div className="admin-brand-logo">
                        <Gamepad2 size={21} />
                    </div>

                    <div>
                        <div className="admin-brand-name">
                            Tambola <span>Pulse</span>
                        </div>

                        <div className="admin-brand-subtitle">
                            ADMIN DESK
                        </div>
                    </div>

                    <button
                        className="admin-sidebar-close"
                        onClick={() =>
                            setSidebarOpen(false)
                        }
                        aria-label="Close navigation"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="admin-nav-label">
                    OPERATIONS
                </div>

                <nav className="admin-navigation">
                    <button
                        className={`admin-nav-item ${activeSection === "overview"
                            ? "active"
                            : ""
                            }`}
                        onClick={() =>
                            scrollToSection("overview")
                        }
                    >
                        <LayoutDashboard size={16} />
                        <span>Live Caller Board</span>
                    </button>

                    <button
                        className={`admin-nav-item ${activeSection === "tickets"
                            ? "active"
                            : ""
                            }`}
                        onClick={() =>
                            scrollToSection("tickets")
                        }
                    >
                        <Ticket size={16} />
                        <span>Ticket Generator</span>
                    </button>

                    <button
                        className={`admin-nav-item ${activeSection === "prizes"
                            ? "active"
                            : ""
                            }`}
                        onClick={() =>
                            scrollToSection("prizes")
                        }
                    >
                        <Trophy size={16} />
                        <span>Prize Matrix</span>
                    </button>

                    <button
                        className={`admin-nav-item ${activeSection === "disputes"
                            ? "active"
                            : ""
                            }`}
                        onClick={() =>
                            scrollToSection("disputes")
                        }
                    >
                        <ShieldCheck size={16} />
                        <span>Dispute Queue</span>
                        <span className="admin-nav-badge">
                            {winnerClaims.filter((claim) => claim.status === "pending").length}
                        </span>
                    </button>

                    <button
                        className={`admin-nav-item ${activeSection === "bookings"
                            ? "active"
                            : ""
                            }`}
                        onClick={() =>
                            scrollToSection("bookings")
                        }
                    >
                        <FileText size={16} />
                        <span>Booking History</span>
                    </button>

                    <button
                        className={`admin-nav-item ${activeSection === "payments"
                            ? "active"
                            : ""
                            }`}
                        onClick={() =>
                            scrollToSection("payments")
                        }
                    >
                        <Activity size={16} />
                        <span>Payment History</span>
                    </button>

                    <button
                        className={`admin-nav-item ${activeSection === "history"
                            ? "active"
                            : ""
                            }`}
                        onClick={() =>
                            scrollToSection("history")
                        }
                    >
                        <History size={16} />
                        <span>Historical Sessions</span>
                    </button>
                </nav>

                <div className="admin-nav-label secondary">
                    ROOM
                </div>

                <nav className="admin-navigation">
                    <button
                        className={`admin-nav-item ${activeSection === "room"
                            ? "active"
                            : ""
                            }`}
                        onClick={() =>
                            scrollToSection("room")
                        }
                    >
                        <Settings size={16} />
                        <span>Room Config</span>
                    </button>

                    <button
                        className="admin-nav-item admin-return"
                        onClick={() => {
                            window.location.href = "/";
                        }}
                    >
                        <ArrowLeft size={16} />
                        <span>Return to Game</span>
                    </button>
                </nav>

                <div className="admin-sidebar-footer">
                    <div className="admin-rng-status">
                        <span className="admin-rng-dot" />

                        <div>
                            <strong>RNG SYSTEM ONLINE</strong>
                            <small>
                                Secure draw engine operational
                            </small>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN */}
            <main className="admin-main">
                {/* HEADER */}
                <header className="admin-header">
                    <div className="admin-header-left">
                        <button
                            className="admin-mobile-menu"
                            onClick={() =>
                                setSidebarOpen(true)
                            }
                            aria-label="Open navigation"
                        >
                            <Menu size={19} />
                        </button>

                        <div>
                            <div className="admin-deck-title">
                                ADMIN OPERATIONAL DECK
                            </div>
                        </div>

                        <div className="admin-live-indicator">
                            <span />
                            {gameState.toUpperCase()}
                        </div>
                    </div>

                    <div className="admin-header-right">
                        <div className="admin-escrow">
                            <span>ESCROW</span>
                            <strong>₹{room?.jackpot ?? 0}</strong>
                        </div>

                        <button
                            className="admin-header-button"
                            onClick={() =>
                                setNotifications(
                                    (value) => !value,
                                )
                            }
                            aria-label="Toggle notifications"
                        >
                            <Bell size={17} />

                            {notifications && (
                                <span className="admin-notification-dot" />
                            )}
                        </button>

                        <div className="admin-avatar">
                            A
                        </div>
                    </div>
                </header>

                <div className="admin-content">
                    {/* CREATE ROOM — ALWAYS AVAILABLE */}
                    <CreateRoomPanel
                        form={roomForm}
                        setForm={setRoomForm}
                        onSubmit={handleCreateRoom}
                        busy={creatingRoom}
                    />

                    {room ? (
                        <>
                            {/* ROOM HEADER */}
                            <section
                                id="room"
                                className="admin-room-header"
                            >
                                <div className="admin-room-info">
                                    <div className="admin-room-icon">
                                        <Gamepad2 size={22} />
                                    </div>

                                    <div>
                                        <div className="admin-room-name">
                                            Room #{roomCode}

                                            <span className="admin-room-live">
                                                <span />
                                                {gameState === "live" ? "LIVE HOST SESSION" : gameState.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="admin-room-meta">
                                            Jackpot
                                            <strong>
                                                ₹{room?.jackpot ?? 0}
                                            </strong>

                                            <span>•</span>

                                            Tickets
                                            <strong>
                                                {totalGenerated}
                                            </strong>

                                            <span>•</span>

                                            Balls
                                            <strong>
                                                {calledBalls.length}
                                                /{room?.balls ?? 90}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="admin-room-actions">
                                    <div className="admin-database-sync">
                                        <span />
                                        DATABASE SYNCED
                                    </div>

                                    <button className="admin-action-button" onClick={clearSelectedRoom}>
                                        <X size={14} />
                                        New Room
                                    </button>

                                    <button
                                        className="admin-action-button"
                                        onClick={resetRoom}
                                    >
                                        <RefreshCcw size={14} />
                                        Reset
                                    </button>

                                    <button
                                        className="admin-action-danger"
                                        onClick={terminateGame}
                                    >
                                        <XCircle size={14} />
                                        Terminate
                                    </button>
                                </div>
                            </section>

                            {/* OVERVIEW */}
                            <section
                                id="overview"
                                className="admin-section"
                            >
                                <div className="admin-control-grid">
                                    {/* SCHEDULER */}
                                    <div className="admin-panel">
                                        <PanelHeader
                                            icon={CalendarClock}
                                            title="Game Scheduler & Launcher"
                                            description="Prepare and control the active Tambola session."
                                            tag="SESSION CONTROL"
                                        />

                                        <div className="admin-scheduler">
                                            <div className="admin-schedule-box">
                                                <span>
                                                    START TIME
                                                </span>

                                                <strong>
                                                    20:00
                                                    <small>IST</small>
                                                </strong>

                                                <div className="admin-countdown">
                                                    Session scheduled for tonight
                                                </div>
                                            </div>

                                            <div className="admin-schedule-box">
                                                <span>
                                                    PLAYERS
                                                </span>

                                                <strong>
                                                    128
                                                </strong>

                                                <div className="admin-countdown">
                                                    <strong>
                                                        +12
                                                    </strong>{" "}
                                                    this session
                                                </div>
                                            </div>
                                        </div>

                                        <div className="admin-scheduler-actions">
                                            <button
                                                className="admin-start-game"
                                                onClick={startGame}
                                            >
                                                <Play size={15} />
                                                START GAME
                                            </button>

                                            <button
                                                className="admin-secondary-action"
                                                onClick={toggleGame}
                                            >
                                                {gameState ===
                                                    "live" ? (
                                                    <>
                                                        <Pause size={14} />
                                                        Pause
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play size={14} />
                                                        Resume
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <div className="admin-rule">
                                            <CheckCircle2 size={12} />
                                            All booking payments are synchronized.
                                        </div>
                                    </div>

                                    {/* CALLER */}
                                    <div className="admin-panel caller-panel">
                                        <PanelHeader
                                            icon={Zap}
                                            title="Automated Caller"
                                            description="Secure live draw engine."
                                            tag={
                                                gameState ===
                                                    "live"
                                                    ? "LIVE"
                                                    : gameState.toUpperCase()
                                            }
                                        />

                                        <div className="admin-current-ball-area">
                                            <div className="admin-ball">
                                                <span>
                                                    CURRENT BALL
                                                </span>

                                                <strong>
                                                    {currentBall ||
                                                        "--"}
                                                </strong>

                                                <small>
                                                    / {room?.balls ?? 90}
                                                </small>
                                            </div>
                                        </div>

                                        <div className="admin-next-draw">
                                            <span>
                                                NEXT DRAW
                                            </span>

                                            <strong>
                                                {cadence}s
                                            </strong>
                                        </div>

                                        <div className="admin-progress">
                                            <span
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        (calledBalls.length /
                                                            Math.max(room?.balls ?? 90, 1)) *
                                                        100,
                                                    )}%`,
                                                }}
                                            />
                                        </div>

                                        <div className="admin-cadence">
                                            <span>
                                                CALL CADENCE
                                            </span>

                                            {[3, 5, 10].map(
                                                (value) => (
                                                    <button
                                                        key={value}
                                                        className={
                                                            cadence ===
                                                                value
                                                                ? "active"
                                                                : ""
                                                        }
                                                        onClick={() =>
                                                            setCadence(
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        {value}s
                                                    </button>
                                                ),
                                            )}
                                        </div>

                                        <button
                                            className="admin-draw-button"
                                            onClick={drawBall}
                                            disabled={
                                                gameState !== "live"
                                            }
                                        >
                                            <Zap size={14} />
                                            DRAW NEXT BALL
                                        </button>

                                        <div className="admin-recent-calls">
                                            <span>
                                                RECENT CALLS
                                            </span>

                                            <div className="admin-recent-ball-list">
                                                {calledBalls
                                                    .slice(-5)
                                                    .reverse()
                                                    .map((ball, index) => (
                                                        <div
                                                            key={`${ball}-${index}`}
                                                            className={`recent-ball ${index === 0 ? "current" : ""
                                                                }`}
                                                        >
                                                            {ball}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* LIVE STATS */}
                                <div className="admin-stats">
                                    <StatCard
                                        icon={Users}
                                        label="ACTIVE PLAYERS"
                                        value={totalBookings}
                                        detail="confirmed booking records"
                                        tone="green"
                                    />

                                    <StatCard
                                        icon={Ticket}
                                        label="TICKETS SOLD"
                                        value={bookedTickets}
                                        detail={`${Math.round(
                                            (bookedTickets /
                                                Math.max(
                                                    totalGenerated,
                                                    1,
                                                )) *
                                            100,
                                        )}% of inventory`}
                                    />

                                    <StatCard
                                        icon={Trophy}
                                        label="JACKPOT"
                                        value={`₹${room?.jackpot ?? 0}`}
                                        detail="Current prize pool"
                                        tone="orange"
                                    />

                                    <StatCard
                                        icon={Activity}
                                        label="GAME STATUS"
                                        value={
                                            gameState === "live"
                                                ? "LIVE"
                                                : gameState ===
                                                    "paused"
                                                    ? "PAUSED"
                                                    : gameState ===
                                                        "terminated"
                                                        ? "ENDED"
                                                        : "READY"
                                        }
                                        detail={`Ball #${currentBall || "--"
                                            }`}
                                        tone="purple"
                                    />
                                </div>
                            </section>

                            {/* TICKETS */}
                            <section
                                id="tickets"
                                className="admin-panel admin-generator-panel"
                            >
                                <PanelHeader
                                    icon={Ticket}
                                    title="Ticket Generation & Live Sync Deck"
                                    description="Generate unique Tambola tickets and prepare them for the live room."
                                    tag="INVENTORY CONTROL"
                                />

                                <div className="admin-generator-actions">
                                    <div className="admin-count-input">
                                        <span>
                                            TICKETS
                                        </span>

                                        <input
                                            type="number"
                                            min="1"
                                            max="1000"
                                            value={ticketCount}
                                            onChange={(event) =>
                                                setTicketCount(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <button
                                        className="admin-generate-button"
                                        onClick={generateTickets}
                                    >
                                        <Ticket size={14} />
                                        Generate Unique Tickets
                                    </button>

                                    <button
                                        className="admin-export-button"
                                        onClick={() =>
                                            setLastAction(
                                                "Export requested",
                                            )
                                        }
                                    >
                                        <Download size={14} />
                                        Export PDF
                                    </button>
                                </div>

                                <div className="admin-inventory">
                                    <div>
                                        <span>
                                            TOTAL GENERATED
                                        </span>
                                        <strong>
                                            {totalGenerated}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            AVAILABLE
                                        </span>
                                        <strong className="green-text">
                                            {availableTickets}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            BOOKED
                                        </span>
                                        <strong className="purple-text">
                                            {bookedTickets}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            HELD
                                        </span>
                                        <strong className="orange-text">
                                            1
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            CAPACITY
                                        </span>
                                        <strong>
                                            1,000
                                        </strong>
                                    </div>
                                </div>

                                <div className="admin-ticket-grid-list">
                                    {tickets
                                        .slice(0, 8)
                                        .map((ticket) => (
                                            <TicketCard
                                                key={ticket.code}
                                                ticket={ticket}
                                            />
                                        ))}
                                </div>

                                <button
                                    className="admin-view-all"
                                    onClick={() =>
                                        setLastAction(
                                            "Ticket inventory opened",
                                        )
                                    }
                                >
                                    View full ticket inventory
                                    <ChevronRight size={13} />
                                </button>
                            </section>

                            {/* PRIZES */}
                            <section
                                id="prizes"
                                className="admin-two-column"
                            >
                                <div className="admin-panel">
                                    <PanelHeader
                                        icon={Trophy}
                                        title="Prize Matrix"
                                        description="Winning categories and configured payouts."
                                        tag="PAYOUT"
                                    />

                                    <div className="admin-prize-list">
                                        {(room?.prizes || []).map((prize, index) => {
                                            const verifiedWinner = winnerClaims.find(
                                                (claim) =>
                                                    String(claim.prizeId) ===
                                                    String(prize.id) &&
                                                    claim.status === "verified",
                                            );

                                            const pendingClaim = winnerClaims.find(
                                                (claim) =>
                                                    String(claim.prizeId) ===
                                                    String(prize.id) &&
                                                    claim.status === "pending",
                                            );

                                            return (
                                                <div
                                                    className="admin-prize-row"
                                                    key={prize.id || index}
                                                >
                                                    <div className="admin-prize-icon">
                                                        <Trophy size={13} />
                                                    </div>

                                                    <div className="admin-prize-info">
                                                        <span>{prize.name}</span>

                                                        {verifiedWinner ? (
                                                            <small className="prize-winner">
                                                                Winner:{" "}
                                                                {verifiedWinner.user?.name ||
                                                                    "Unknown"}
                                                            </small>
                                                        ) : pendingClaim ? (
                                                            <small className="prize-pending">
                                                                Claim under review
                                                            </small>
                                                        ) : (
                                                            <small className="prize-open">
                                                                {prize.enabled === false
                                                                    ? "Disabled"
                                                                    : "Available"}
                                                            </small>
                                                        )}
                                                    </div>

                                                    <strong>
                                                        ₹
                                                        {Number(
                                                            prize.amount || 0,
                                                        ).toLocaleString("en-IN")}
                                                    </strong>

                                                    <small>
                                                        {Number(prize.winners || 1)}
                                                        {Number(prize.winners || 1) === 1
                                                            ? " WINNER"
                                                            : " WINNERS"}
                                                    </small>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="admin-payout-footer">
                                        <span>
                                            TOTAL CONFIGURED PAYOUT
                                        </span>

                                        <strong>
                                            ₹
                                            {(room?.prizes || [])
                                                .filter((prize) => prize.enabled !== false)
                                                .reduce(
                                                    (total, prize) =>
                                                        total +
                                                        Number(prize.amount || 0) *
                                                        Number(prize.winners || 1),
                                                    0,
                                                )
                                                .toLocaleString("en-IN")}
                                        </strong>
                                    </div>
                                </div>

                                {/* DISPUTES */}
                                <div
                                    id="disputes"
                                    className="admin-panel admin-verification-panel"
                                >
                                    <PanelHeader
                                        icon={ShieldCheck}
                                        title="Dispute & Verification Queue"
                                        description="Review player claims, verify the exact ticket and approve or reject the requested prize."
                                        tag={`${winnerClaims.filter((claim) => claim.status === "pending").length} PENDING`}
                                    />

                                    <div className="admin-verification-summary">
                                        <div className="verification-summary-item">
                                            <span>PENDING</span>
                                            <strong>{winnerClaims.filter((claim) => claim.status === "pending").length}</strong>
                                        </div>
                                        <div className="verification-summary-item">
                                            <span>VERIFIED</span>
                                            <strong>{winnerClaims.filter((claim) => claim.status === "verified").length}</strong>
                                        </div>
                                        <div className="verification-summary-item">
                                            <span>REJECTED</span>
                                            <strong>{winnerClaims.filter((claim) => claim.status === "rejected").length}</strong>
                                        </div>
                                    </div>

                                    <div className="admin-verification-list">
                                        {winnerClaims.length === 0 ? (
                                            <div className="verification-empty">
                                                <ShieldCheck size={28} />
                                                <strong>No claims submitted</strong>
                                                <span>Player prize claims will appear here when submitted.</span>
                                            </div>
                                        ) : (
                                            winnerClaims.map((claim) => {
                                                const status = String(claim.status || "pending").toLowerCase();
                                                const ticketLabel = claim.ticket?.publicCode || claim.ticket?.code || claim.ticket?.number || "Unknown ticket";
                                                return (
                                                    <div className={`verification-claim-card ${status}`} key={claim._id}>
                                                        <div className="verification-claim-main">
                                                            <div className={`verification-claim-icon ${status}`}>
                                                                {status === "verified" ? <CheckCircle2 size={17} /> : status === "rejected" ? <XCircle size={17} /> : <AlertTriangle size={17} />}
                                                            </div>
                                                            <div className="verification-claim-content">
                                                                <div className="verification-claim-title">
                                                                    <strong>{claim.prizeName || "Prize Claim"}</strong>
                                                                    <span className={`verification-status-pill ${status}`}>{status.toUpperCase()}</span>
                                                                </div>
                                                                <div className="verification-claim-player">
                                                                    <UserRound size={13} />
                                                                    <span>{claim.user?.name || "Unknown Player"}</span>
                                                                    <span className="verification-separator">•</span>
                                                                    <Phone size={13} />
                                                                    <span>{claim.user?.phone || "N/A"}</span>
                                                                </div>
                                                                <div className="verification-claim-meta">
                                                                    <span>Ticket <strong>{ticketLabel}</strong></span>
                                                                    <span>Prize <strong>₹{Number(claim.prizeAmount || 0).toLocaleString("en-IN")}</strong></span>
                                                                    <span>{claim.claimedAt ? new Date(claim.claimedAt).toLocaleString("en-IN") : "Time unavailable"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="verification-claim-actions">
                                                            <button
                                                                type="button"
                                                                className="verification-review-button"
                                                                onClick={() => setWinnerAlert(claim)}
                                                            >
                                                                <ShieldCheck size={14} />
                                                                {status === "pending" ? "Review Claim" : "View Details"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <button
                                        className="admin-view-queue"
                                        type="button"
                                        onClick={() => document.getElementById("disputes")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                                    >
                                        Open Verification Queue
                                        <ChevronRight size={13} />
                                    </button>
                                </div>
                            </section>

                            {/* BOOKINGS */}
                            <section
                                id="bookings"
                                className="admin-panel admin-booking-panel"
                            >
                                <PanelHeader
                                    icon={FileText}
                                    title="Booking History & Ticket Mapping"
                                    description="Review bookings, payment state and assigned tickets."
                                    tag={`${totalBookings} BOOKINGS`}
                                />

                                <div className="admin-booking-table-wrap">
                                    <table className="admin-booking-table">
                                        <thead>
                                            <tr>
                                                <th>REFERENCE</th>
                                                <th>PLAYER</th>
                                                <th>TICKETS</th>
                                                <th>AMOUNT</th>
                                                <th>PAYMENT</th>
                                                <th>BOOKING</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {bookings.map(
                                                (booking) => (
                                                    <tr
                                                        key={
                                                            booking.reference
                                                        }
                                                    >
                                                        <td className="reference">
                                                            {
                                                                booking.reference
                                                            }
                                                        </td>

                                                        <td className="muted">
                                                            {booking.user?.name ||
                                                                booking.user?.phone ||
                                                                "Unknown"}
                                                        </td>

                                                        <td>
                                                            <div className="ticket-pills">
                                                                {(booking.tickets || []).map(
                                                                    (
                                                                        ticket,
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                ticket
                                                                            }
                                                                        >
                                                                            {typeof ticket === "string"
                                                                                ? ticket.split("-")[2]
                                                                                : ticket.number}

                                                                        </span>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="amount">
                                                            ₹{booking.total ?? booking.amount ?? 0}
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`payment-status ${booking.paymentStatus ===
                                                                    "pending"
                                                                    ? "pending"
                                                                    : ""
                                                                    }`}
                                                            >
                                                                <span />
                                                                {booking.paymentStatus || "pending"}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`booking-status ${booking.status ===
                                                                    "held"
                                                                    ? "held"
                                                                    : ""
                                                                    }`}
                                                            >
                                                                {
                                                                    booking.status
                                                                }
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* PAYMENTS */}
                            <section
                                id="payments"
                                className="admin-panel admin-booking-panel"
                            >
                                <PanelHeader
                                    icon={Activity}
                                    title="Payment History"
                                    description="Live payment records synchronized from confirmed and pending bookings."
                                    tag={`${payments.length} PAYMENTS`}
                                />

                                <div className="admin-booking-table-wrap">
                                    <table className="admin-booking-table">
                                        <thead>
                                            <tr>
                                                <th>PAYMENT</th>
                                                <th>BOOKING</th>
                                                <th>PLAYER</th>
                                                <th>METHOD</th>
                                                <th>AMOUNT</th>
                                                <th>STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="muted">
                                                        No payment records yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                payments.map((payment) => (
                                                    <tr key={payment._id || payment.reference}>
                                                        <td className="reference">
                                                            {payment.razorpayPaymentId || "—"}
                                                        </td>
                                                        <td className="reference">
                                                            {payment.reference || "—"}
                                                        </td>
                                                        <td className="muted">
                                                            {payment.user?.name || payment.user?.phone || "Unknown"}
                                                        </td>
                                                        <td>
                                                            {(payment.paymentMethod || "—").replaceAll("_", " ").toUpperCase()}
                                                        </td>
                                                        <td className="amount">
                                                            ₹{payment.total ?? payment.amount ?? 0}
                                                        </td>
                                                        <td>
                                                            <span
                                                                className={`payment-status ${payment.paymentStatus !== "paid" ? "pending" : ""}`}
                                                            >
                                                                <span />
                                                                {payment.paymentStatus || "pending"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* HISTORY */}
                            <section
                                id="history"
                                className="admin-panel"
                            >
                                <PanelHeader
                                    icon={History}
                                    title="Historical Game Sessions"
                                    description="Previous rooms and operational records."
                                    tag="ARCHIVE"
                                />

                                <div className="admin-history-grid">
                                    {historyRows.map((item) => (
                                        <div
                                            className="admin-history-card"
                                            key={item.room}
                                        >
                                            <span>
                                                {item.room}
                                            </span>

                                            <strong>
                                                {item.name}
                                            </strong>

                                            <small>
                                                {item.date}
                                            </small>

                                            <div>
                                                {item.jackpot}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* ACTION STATUS */}
                            {lastAction && (
                                <div
                                    className="admin-rule"
                                    style={{
                                        marginBottom: 10,
                                    }}
                                >
                                    <CheckCircle2 size={12} />
                                    {lastAction}
                                </div>
                            )}

                            {/* FOOTER */}
                            <footer className="admin-footer">
                                <div>
                                    <span className="admin-rng-dot" />
                                    API System Operational
                                </div>

                                <div>
                                    Room {roomCode}
                                    <span>•</span>
                                    {totalBookings} bookings
                                    <span>•</span>
                                    ₹{totalRevenue} revenue
                                </div>

                                <div>
                                    <Clock3 size={12} />
                                    AdminDesk
                                </div>
                            </footer>
                        </>
                    ) : (
                        <section className="admin-panel" style={{ marginTop: 24 }}>
                            <PanelHeader
                                icon={Gamepad2}
                                title="No Active Room Selected"
                                description="Create a room above. Once created, it will appear here and become the active AdminDesk room."
                                tag="READY"
                            />
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}