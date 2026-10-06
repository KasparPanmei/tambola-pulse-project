import { useCallback, useEffect, useState } from "react";
import {
    Award,
    CheckCircle2,
    Gauge,
    Dices,
    DoorOpen,
} from "lucide-react";

import api from "../lib/api.js";
import BackConfirmationGuard from "../components/BackConfirmationGuard.jsx";

import Header from "../components/Header.jsx";
import BottomNav from "../components/BottomNav.jsx";
import Countdown from "../components/Countdown.jsx";
import CheckoutModal from "../components/CheckoutModal.jsx";
import PaymentScreen from "../components/PaymentScreen.jsx";
import JoinRoomModal from "../components/JoinRoomModal.jsx";

export default function Home() {
    const [room, setRoom] = useState(null);
    const [tickets, setTickets] = useState([]);

    const [checkout, setCheckout] = useState(false);
    const [booking, setBooking] = useState(null);
    // CHANGED: Control the homepage Join Room dialog from the prominent upcoming-room CTA.
    const [joinRoomOpen, setJoinRoomOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            // CHANGED: Add a cache-busting query value so termination and newly created rooms appear immediately.
            const { data } = await api.get("/rooms/active", {
                params: { _ts: Date.now() },
            });

            // CHANGED: Render room tickets/countdowns only for live or upcoming rooms; closed/paused/unknown states are treated as no public room.
            if (!data?.room || !["live", "upcoming"].includes(data.room.status)) {
                setRoom(null);
                setTickets([]);
            } else {
                setRoom(data.room);
                setTickets(data.tickets || []);
            }
            setError("");
        } catch (e) {
            console.error("Room loading error:", e);

            setRoom(null);
            setTickets([]);

            // CHANGED: A terminated/absent room is an ordinary empty-home state and will refresh when a new room is created.
            setError(
                e.response?.status === 404
                    ? ""
                    : e.response?.data?.message || "Could not load active room"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();

        const interval = setInterval(() => {
            load();
        }, 3000);

        return () => clearInterval(interval);
    }, [load]);

    useEffect(() => {
        // CHANGED: Close an open ticket selector as soon as polling sees that the admin started or ended the game.
        if (!room || room.status !== "upcoming") {
            setCheckout(false);
        }
    }, [room?.code, room?.status]);

    /*
     * Payment screen
     */
    if (booking) {
        return (
            // CHANGED: Device back during payment asks before abandoning the payment flow.
            <BackConfirmationGuard
                active
                onConfirm={() => {
                    setBooking(null);
                    setCheckout(false);
                }}
            >
                <PaymentScreen
                    booking={booking}
                    onBack={() => setBooking(null)}
                    onSuccess={() => {
                        setBooking(null);
                        setCheckout(false);
                        load();
                    }}
                />
            </BackConfirmationGuard>
        );
    }

    return (
        // CHANGED: Device back during ticket selection asks before returning to Home.
        <BackConfirmationGuard
            active={checkout}
            onConfirm={() => setCheckout(false)}
        >
        <div className="app">

            <Header />

            <main className="page">
                {error && (
                    <div
                        className="small"
                        style={{
                            color: "#ffb4ab",
                            marginBottom: 10,
                        }}
                    >
                        {error}
                    </div>
                )}

                {loading && !room && (
                    <section className="card hero">
                        <div className="small muted">
                            Loading active game...
                        </div>
                    </section>
                )}


                {!loading && !room && (
                    // CHANGED: Make room termination visible as a clean no-active-room state.
                    <section className="card hero no-active-room">
                        <div className="section-title">No active room right now</div>
                        <div className="small muted">The previous room has ended. Please check back when the next game room is available.</div>
                    </section>
                )}

                {room && (
                    <section className="card hero">

                        {/* Room status + countdown */}
                        <div className="row">

                            <span className="label live">
                                <span className="dot" />

                                {room.status === "live"
                                    ? "Live Room"
                                    : "Upcoming Room"}

                                {" "}#{room.code}
                            </span>

                            <span className="pill">
                                {room.status === "live"
                                    ? "Live Now"
                                    : "Starts in "}

                                {room.status !== "live" && (
                                    <Countdown
                                        target={
                                            new Date(
                                                room.startsAt
                                            )
                                        }
                                    />
                                )}
                            </span>

                        </div>


                        {/* Room title */}
                        <div className="title">
                            {room.title}
                        </div>


                        {/* Description */}
                        <div className="small muted">
                            {room.description}
                        </div>

                        <div className="metrics">

                            <div className="metric">
                                <Dices
                                    size={18}
                                    color="var(--pl)"
                                />

                                {room.balls || 90} Balls Classical
                            </div>


                            <div className="metric">
                                <Award
                                    size={18}
                                    color="var(--amber)"
                                />

                                ₹
                                {Number(
                                    room.jackpot || 0
                                ).toLocaleString()}

                                {" "}Bumper
                            </div>


                            <div className="metric">
                                <Gauge
                                    size={18}
                                    color="var(--green)"
                                />

                                Automatic prize claims
                            </div>


                            <div className="metric">
                                <CheckCircle2
                                    size={18}
                                    color="var(--sec)"
                                />

                                100% UPI Cashout
                            </div>

                        </div>

                        <button
                            className="btn primary"
                            onClick={() =>
                                setCheckout(true)
                            }
                            // CHANGED: Ticket selection is available only before the admin starts the game.
                            disabled={room.status !== "upcoming" || tickets.length === 0}
                        >
                            {room.status !== "upcoming"
                                ? "Ticket Sales Closed"
                                : tickets.length > 0
                                ? `Select Tickets • ₹${room.ticketPrice}/-`
                                : "Tickets Sold Out"}
                        </button>

                    </section>
                )}

                {room?.status === "upcoming" && (
                    // CHANGED: Add a conspicuous pre-game countdown and Join Room action directly below the ticket hero card.
                    <section className="home-upcoming-room-card" aria-label="Upcoming game room">
                        <div className="home-upcoming-room-copy">
                            <span className="home-upcoming-eyebrow">NEXT GAME STARTS IN</span>
                            <strong className="home-upcoming-countdown">
                                <Countdown target={new Date(room.startsAt)} />
                            </strong>
                            <span className="home-upcoming-room-code">Room #{room.code}</span>
                        </div>
                        <button
                            type="button"
                            className="home-join-room-button"
                            onClick={() => setJoinRoomOpen(true)}
                        >
                            <DoorOpen size={20} />
                            Join Room
                        </button>
                    </section>
                )}


                <section
                    className="card pad"
                    style={{
                        marginTop: 12,
                    }}
                >

                    <div className="label muted">
                        Ticket Feed
                    </div>

                    <div
                        className="small muted"
                        style={{
                            marginTop: 5,
                        }}
                    >
                        {tickets.length > 0
                            ? `${tickets.length} tickets currently available. Select available tickets to open the secure checkout flow.`
                            : "No tickets are currently available."}
                    </div>

                </section>

            </main>


            <BottomNav />

            {checkout && room && (
                <CheckoutModal
                    room={room}
                    tickets={tickets}
                    onClose={() =>
                        setCheckout(false)
                    }
                    onPayment={(booking) => {
                        setCheckout(false);
                        setBooking(booking);
                    }}
                />
            )}

            {joinRoomOpen && (
                <JoinRoomModal onClose={() => setJoinRoomOpen(false)} />
            )}

        </div>
        </BackConfirmationGuard>
    );
}
