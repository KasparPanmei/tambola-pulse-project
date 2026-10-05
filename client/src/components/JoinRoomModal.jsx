import { useEffect, useState } from "react";
import {
    ArrowRight,
    DoorOpen,
    LockKeyhole,
    X,
    Smartphone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import BackConfirmationGuard from "./BackConfirmationGuard.jsx";

export default function JoinRoomModal({ onClose }) {
    const navigate = useNavigate();

    const [roomCode, setRoomCode] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        try {
            const user = JSON.parse(
                localStorage.getItem("tp_user") || "null"
            );

            if (user?.phone) {
                setPhone(user.phone);
            }
        } catch {
            setPhone("");
        }
    }, []);

    async function handleJoin(event) {
        event.preventDefault();

        setError("");

        const code = roomCode.trim().toUpperCase();
        const cleanPhone = phone.replace(/\s/g, "");

        if (!code) {
            setError("Please enter the room code.");
            return;
        }

        if (!cleanPhone) {
            setError("Please enter your registered mobile number.");
            return;
        }

        const token = localStorage.getItem("tp_token");

        if (!token) {
            setError(
                "Please verify your mobile number before joining the room."
            );
            return;
        }

        setLoading(true);

        try {
            const { data } = await api.post(
                "/bookings/join-room",
                {
                    roomCode: code,
                    phone: cleanPhone,
                }
            );

            if (!data?.success || !data?.room?.code) {
                throw new Error("Invalid room response.");
            }

            onClose();

            navigate(`/room/${data.room.code}`);
        } catch (err) {
            console.error("Join room error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to verify room access."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        // CHANGED: Hardware/device back while joining asks before returning Home.
        <BackConfirmationGuard active onConfirm={onClose}>
        <div
            className="join-room-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !loading) {
                    onClose();
                }
            }}
        >
            <div
                className="join-room-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="join-room-title"
            >
                <button
                    type="button"
                    className="join-room-close"
                    onClick={onClose}
                    disabled={loading}
                    aria-label="Close"
                >
                    <X size={18} />
                </button>

                <div className="join-room-icon">
                    <DoorOpen size={25} />
                </div>

                <h2
                    id="join-room-title"
                    className="join-room-title"
                >
                    Join Game Room
                </h2>

                <p className="join-room-description">
                    Enter your room code and the mobile number
                    registered with your ticket booking.
                </p>

                <form onSubmit={handleJoin}>
                    <label className="join-room-label">
                        Room Code
                    </label>

                    <input
                        className="join-room-input"
                        type="text"
                        value={roomCode}
                        onChange={(event) =>
                            setRoomCode(
                                event.target.value.toUpperCase()
                            )
                        }
                        placeholder="e.g. TAM-8843"
                        autoComplete="off"
                        maxLength={30}
                        disabled={loading}
                    />

                    <label className="join-room-label">
                        Registered Mobile Number
                    </label>

                    <div className="join-phone-wrapper">
                        <Smartphone size={17} />

                        <input
                            className="join-room-phone-input"
                            type="tel"
                            value={phone}
                            onChange={(event) =>
                                setPhone(event.target.value)
                            }
                            placeholder="+91 7982239573"
                            inputMode="tel"
                            autoComplete="tel"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="join-room-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="join-room-button"
                        disabled={loading}
                    >
                        {loading ? (
                            "Verifying..."
                        ) : (
                            <>
                                Verify & Join
                                <ArrowRight size={17} />
                            </>
                        )}
                    </button>
                </form>

                <div className="join-room-security">
                    <LockKeyhole size={13} />

                    <span>
                        Access requires a valid room code,
                        registered mobile number and confirmed
                        ticket booking.
                    </span>
                </div>
            </div>
        </div>
        </BackConfirmationGuard>
    );
}