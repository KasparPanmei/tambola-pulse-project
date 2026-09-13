import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
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
    LayoutDashboard,
    Menu,
    Pause,
    Play,
    RefreshCcw,
    Settings,
    ShieldCheck,
    Ticket,
    Trophy,
    Users,
    X,
    XCircle,
    Zap,
} from "lucide-react";

const prizeRows = [
    {
        name: "Early Five",
        prize: "₹1,000",
        winners: "1 winner",
    },
    {
        name: "Four Corners",
        prize: "₹1,500",
        winners: "1 winner",
    },
    {
        name: "Top Line",
        prize: "₹2,000",
        winners: "1 winner",
    },
    {
        name: "Middle Line",
        prize: "₹2,000",
        winners: "1 winner",
    },
    {
        name: "Bottom Line",
        prize: "₹2,000",
        winners: "1 winner",
    },
    {
        name: "Full House",
        prize: "₹6,500",
        winners: "1 winner",
    },
];

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
    return (
        <section className="admin-panel" style={{ marginTop: 24 }}>
            <PanelHeader
                icon={Settings}
                title="Create Game Room"
                description="Create the room that players will use. Tickets can be generated after the room is created."
                tag="ROOM SETUP"
            />
            <form onSubmit={onSubmit}>
                <div className="admin-generator-actions" style={{ alignItems: "stretch", flexWrap: "wrap" }}>
                    <div className="admin-count-input" style={{ minWidth: 180 }}><span>ROOM CODE</span><input value={form.code} onChange={(e) => setForm((v) => ({ ...v, code: e.target.value.toUpperCase() }))} placeholder="TAM-8842" required /></div>
                    <div className="admin-count-input" style={{ minWidth: 260 }}><span>TITLE</span><input value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} placeholder="Pick Your Lucky Numbers & Win Jackpot Housie" required /></div>
                    <div className="admin-count-input" style={{ minWidth: 160 }}><span>TICKET PRICE</span><input type="number" min="0" value={form.ticketPrice} onChange={(e) => setForm((v) => ({ ...v, ticketPrice: e.target.value }))} required /></div>
                    <div className="admin-count-input" style={{ minWidth: 160 }}><span>JACKPOT</span><input type="number" min="0" value={form.jackpot} onChange={(e) => setForm((v) => ({ ...v, jackpot: e.target.value }))} required /></div>
                    <div className="admin-count-input" style={{ minWidth: 160 }}><span>BALLS</span><input type="number" min="1" max="90" value={form.balls} onChange={(e) => setForm((v) => ({ ...v, balls: e.target.value }))} required /></div>
                    <div className="admin-count-input" style={{ minWidth: 220 }}><span>START TIME</span><input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((v) => ({ ...v, startsAt: e.target.value }))} /></div>
                </div>
                <div style={{ marginTop: 16 }}>
                    <label style={{ display: "block" }}>
                        <span style={{ display: "block", marginBottom: 8, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>DESCRIPTION</span>
                        <textarea value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} placeholder="Official weekend mega bumper draw with instant UPI automated settlements." rows={3} style={{ width: "100%", resize: "vertical" }} />
                    </label>
                </div>
                <div className="admin-scheduler-actions" style={{ marginTop: 16 }}>
                    <button className="admin-start-game" type="submit" disabled={busy}><Gamepad2 size={15} />{busy ? "CREATING ROOM..." : "CREATE ROOM"}</button>
                </div>
            </form>
        </section>
    );
}

export default function Admin() {
    const navigate = useNavigate();

    useEffect(() => {
        try {
            const token = localStorage.getItem("tp_token");
            const user = JSON.parse(
                localStorage.getItem("tp_user") || "null",
            );

            if (!token || user?.role !== "admin") {
                navigate("/", {
                    replace: true,
                });
            }
        } catch {
            localStorage.removeItem("tp_token");
            localStorage.removeItem("tp_user");

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
    const [roomForm, setRoomForm] = useState({
        code: "",
        title: "Pick Your Lucky Numbers & Win Jackpot Housie",
        description: "Official weekend mega bumper draw with instant UPI automated settlements.",
        startsAt: "",
        ticketPrice: 50,
        jackpot: 15000,
        balls: 90,
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

    const [currentBall, setCurrentBall] =
        useState(47);

    const [calledBalls, setCalledBalls] = useState([
        31,
        12,
        64,
        27,
        47,
    ]);

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
        if (!silent) setLoading(true);
        try {
            const [roomResponse, ticketsResponse, bookingsResponse, paymentsResponse] = await Promise.all([
                api.get(`/rooms/${encodeURIComponent(roomCode)}`),
                api.get(`/admin/tickets?room=${encodeURIComponent(roomCode)}`),
                api.get(`/admin/bookings?room=${encodeURIComponent(roomCode)}`),
                api.get(`/admin/payments?room=${encodeURIComponent(roomCode)}`).catch(() => ({ data: { payments: [] } })),
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
        if (!roomCode) return undefined;
        const interval = setInterval(() => loadAdminData({ silent: true }), 3000);
        return () => clearInterval(interval);
    }, [roomCode]);

    async function handleCreateRoom(event) {
        event.preventDefault(); setCreatingRoom(true); setLastAction("");
        try {
            const payload = { ...roomForm, code: roomForm.code.trim().toUpperCase(), ticketPrice: Number(roomForm.ticketPrice), jackpot: Number(roomForm.jackpot), balls: Number(roomForm.balls), startsAt: roomForm.startsAt || undefined };
            const { data } = await api.post("/admin/rooms", payload);
            const createdRoom = data.room; const code = createdRoom.code;
            localStorage.setItem("tp_admin_room_code", code); setRoomCode(code); setRoom(createdRoom);
            setLastAction(`Room ${code} created successfully.`);

            setRoomForm({
                code: "",
                title: "Pick Your Lucky Numbers & Win Jackpot Housie",
                description: "Official weekend mega bumper draw with instant UPI automated settlements.",
                startsAt: "",
                ticketPrice: 50,
                jackpot: 15000,
                balls: 90,
            });
        } catch (error) {
            console.error("Create room error:", error);
            setLastAction(error.response?.data?.message || "Unable to create room.");
        } finally { setCreatingRoom(false); }
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

    function drawBall() {
        let next;

        do {
            next = Math.floor(Math.random() * 90) + 1;
        } while (calledBalls.includes(next) && calledBalls.length < 90);

        setCurrentBall(next);

        setCalledBalls((previous) => [
            ...previous.slice(-4),
            next,
        ]);

        setLastAction(`Ball ${next} called`);
    }

    async function startGame() {
        try {
            const { data } = await api.post(
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
                const { data } = await api.post(
                    `/admin/rooms/${encodeURIComponent(roomCode)}/pause`,
                );
                setRoom(data.room);
                setLastAction("Game paused");
            } else {
                const { data } = await api.post(
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
            const { data } = await api.post(
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
            const { data } = await api.post(`/admin/rooms/${encodeURIComponent(roomCode)}/reset`);
            setRoom(data.room); setLastAction("Room reset successfully."); await loadAdminData({ silent: true });
        } catch (error) { setLastAction(error.response?.data?.message || "Failed to reset room."); }
    }

    async function generateTickets() {
        if (!roomCode) { setLastAction("Create a room before generating tickets."); return; }
        const requestedCount = Number(ticketCount);
        if (!Number.isInteger(requestedCount) || requestedCount < 1 || requestedCount > 1000) { setLastAction("Ticket count must be between 1 and 1000."); return; }
        try {
            const { data } = await api.post("/admin/tickets/generate", { roomCode, count: requestedCount });
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
                            2
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

                                            <div>
                                                {calledBalls.map(
                                                    (ball, index) => (
                                                        <div
                                                            key={`${ball}-${index}`}
                                                            className={`recent-ball ${index ===
                                                                calledBalls.length -
                                                                1
                                                                ? "current"
                                                                : ""
                                                                }`}
                                                        >
                                                            {ball}
                                                        </div>
                                                    ),
                                                )}
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
                                        {prizeRows.map(
                                            (row, index) => (
                                                <div
                                                    className="admin-prize-row"
                                                    key={row.name}
                                                >
                                                    <div className="admin-prize-icon">
                                                        <Trophy
                                                            size={13}
                                                        />
                                                    </div>

                                                    <span>
                                                        {row.name}
                                                    </span>

                                                    <strong>
                                                        {row.prize}
                                                    </strong>

                                                    <small
                                                        className={
                                                            index ===
                                                                prizeRows.length -
                                                                1
                                                                ? "jackpot"
                                                                : ""
                                                        }
                                                    >
                                                        {row.winners}
                                                    </small>
                                                </div>
                                            ),
                                        )}
                                    </div>

                                    <div className="admin-payout-footer">
                                        <span>
                                            TOTAL CONFIGURED PAYOUT
                                        </span>

                                        <strong>
                                            ₹15,000
                                        </strong>
                                    </div>
                                </div>

                                {/* DISPUTES */}
                                <div
                                    id="disputes"
                                    className="admin-panel"
                                >
                                    <PanelHeader
                                        icon={ShieldCheck}
                                        title="Dispute & Verification Queue"
                                        description="Review player claims and ticket verification requests."
                                        tag="2 PENDING"
                                    />

                                    <div className="admin-dispute-list">
                                        <div className="admin-dispute">
                                            <div className="admin-dispute-icon">
                                                <AlertTriangle
                                                    size={15}
                                                />
                                            </div>

                                            <div>
                                                <strong>
                                                    Ticket claim requires review
                                                </strong>

                                                <span>
                                                    TAM-8842-18
                                                </span>

                                                <small>
                                                    Player claims Full House.
                                                </small>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    setLastAction(
                                                        "Dispute review opened",
                                                    )
                                                }
                                            >
                                                Review
                                            </button>
                                        </div>

                                        <div className="admin-dispute">
                                            <div className="admin-dispute-icon">
                                                <CheckCircle2
                                                    size={15}
                                                />
                                            </div>

                                            <div>
                                                <strong>
                                                    Verification completed
                                                </strong>

                                                <span>
                                                    TAM-8842-11
                                                </span>

                                                <small>
                                                    Claim verified successfully.
                                                </small>
                                            </div>

                                            <span className="payment-status">
                                                <span />
                                                VERIFIED
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        className="admin-view-queue"
                                        onClick={() =>
                                            setLastAction(
                                                "Dispute queue opened",
                                            )
                                        }
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