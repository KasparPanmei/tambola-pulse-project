import { useCallback, useEffect, useState } from "react";
import {
    Award,
    CheckCircle2,
    Gauge,
    Dices,
} from "lucide-react";

import api from "../lib/api.js";

import Header from "../components/Header.jsx";
import BottomNav from "../components/BottomNav.jsx";
import Countdown from "../components/Countdown.jsx";
import CheckoutModal from "../components/CheckoutModal.jsx";
import PaymentScreen from "../components/PaymentScreen.jsx";

export default function Home() {
    const [room, setRoom] = useState(null);
    const [tickets, setTickets] = useState([]);

    const [checkout, setCheckout] = useState(false);
    const [booking, setBooking] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const { data } = await api.get("/rooms/active");

            setRoom(data.room);
            setTickets(data.tickets || []);
            setError("");
        } catch (e) {
            console.error("Room loading error:", e);

            setRoom(null);
            setTickets([]);

            setError(
                e.response?.data?.message ||
                "Could not load active room"
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

    /*
     * Payment screen
     */
    if (booking) {
        return (
            <PaymentScreen
                booking={booking}
                onBack={() => setBooking(null)}
                onSuccess={() => {
                    setBooking(null);
                    setCheckout(false);
                    load();
                }}
            />
        );
    }

    return (
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

                                3.2s Auto-Verify
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
                            disabled={
                                room.status === "closed" ||
                                tickets.length === 0
                            }
                        >
                            {tickets.length > 0
                                ? `Select Tickets • ₹${room.ticketPrice}/-`
                                : "Tickets Sold Out"}
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

        </div>
    );
}