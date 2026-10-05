import { useEffect, useState } from "react";
import {
    ArrowLeft,
    LoaderCircle,
} from "lucide-react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";

import api from "../lib/api.js";
import GameRoom from "../components/GameRoom.jsx";

export default function RoomPage() {
    const { code } = useParams();
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [player, setPlayer] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        async function loadRoom() {
            try {
                setLoading(true);
                setError("");

                const storedUser =
                    JSON.parse(
                        localStorage.getItem(
                            "tp_user"
                        ) || "null"
                    );

                if (!storedUser?.phone) {
                    throw new Error(
                        "Your registered mobile number could not be found. Please login again."
                    );
                }

                const { data } =
                    await api.post(
                        "/bookings/join-room",
                        {
                            roomCode: code,
                            phone: storedUser.phone,
                        }
                    );

                if (!mounted) return;

                setRoom(data.room);
                setTickets(
                    data.tickets || []
                );
                setPlayer(
                    data.player || null
                );
            } catch (err) {
                if (!mounted) return;

                console.error(
                    "RoomPage error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Unable to enter this room."
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadRoom();

        return () => {
            mounted = false;
        };
    }, [code]);

    if (loading) {
        return (
            <div className="app-shell">
                <main className="page-content">
                    <section className="panel-card">
                        <div className="room-loading">
                            <LoaderCircle
                                size={30}
                                className="spin"
                            />

                            <h2>
                                Entering room...
                            </h2>

                            <p>
                                Verifying your
                                registered ticket.
                            </p>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    if (error || !room) {
        return (
            <div className="app-shell">
                <main className="page-content">
                    <section className="panel-card room-error-card">
                        <div className="room-error-icon">
                            !
                        </div>

                        <h2>
                            Unable to Join Room
                        </h2>

                        <p>
                            {error ||
                                "Room information is unavailable."}
                        </p>

                        <button
                            type="button"
                            className="btn ghost"
                            onClick={() =>
                                navigate("/")
                            }
                        >
                            <ArrowLeft size={17} />
                            Back to Home
                        </button>
                    </section>
                </main>
            </div>
        );
    }

    return (
        // CHANGED: The confirmation is scoped to JoinRoomModal; after entry, device Back returns directly to Home.
        <GameRoom room={room} tickets={tickets} player={player} />
    );
}