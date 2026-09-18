import { useState } from "react";
import {
    Gamepad2,
    DoorOpen,
    LayoutDashboard,
    Shield,
    X,
    Smartphone,
    LockKeyhole,
    LoaderCircle,
    CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import JoinRoomModal from "./JoinRoomModal.jsx";
import api from "../lib/api.js";
import adminApi from "../lib/adminApi.js";

const items = [
    ["home", "Home", Gamepad2],
    ["join", "Join Room", DoorOpen],
    ["dashboard", "Dashboard", LayoutDashboard],
    ["admin", "Admin", Shield],
];

export default function BottomNav({
    active = "home",
}) {
    const navigate = useNavigate();

    const [adminModal, setAdminModal] =
        useState(false);
    const [joinModal, setJoinModal] = useState(false);
    const [phone, setPhone] = useState("");

    const [otp, setOtp] = useState([
        "",
        "",
        "",
        "",
        "",
        "",
    ]);

    const [otpSent, setOtpSent] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [devOtp, setDevOtp] =
        useState("");

    function openAdmin() {
        setAdminModal(true);
        setError("");
        setMessage("");
    }

    function closeAdmin() {
        if (loading) return;

        setAdminModal(false);
        setPhone("");
        setOtp(["", "", "", "", "", ""]);
        setOtpSent(false);
        setError("");
        setMessage("");
        setDevOtp("");
    }

    async function requestOTP() {
        setError("");
        setMessage("");
        setDevOtp("");

        const cleanPhone = phone.replace(
            /\s/g,
            "",
        );

        if (
            !/^\+?[1-9]\d{9,14}$/.test(
                cleanPhone,
            )
        ) {
            setError(
                "Enter a valid mobile number.",
            );
            return;
        }

        setLoading(true);

        try {
            const { data } = await adminApi.post(
                "/auth/request-otp",
                {
                    phone: cleanPhone,
                },
            );

            setOtpSent(true);

            if (data.devOtp) {
                setDevOtp(data.devOtp);
            }

            setMessage(
                "OTP sent successfully.",
            );
        } catch (e) {
            setError(
                e.response?.data?.message ||
                "Could not send OTP.",
            );
        } finally {
            setLoading(false);
        }
    }

    function handleOtpChange(index, value) {
        const digit = value
            .replace(/\D/g, "")
            .slice(-1);

        const next = [...otp];

        next[index] = digit;

        setOtp(next);

        if (
            digit &&
            index < 5
        ) {
            document
                .getElementById(
                    `admin-otp-${index + 1}`,
                )
                ?.focus();
        }
    }

    async function verifyOTP() {
        setError("");
        setMessage("");

        const cleanPhone = phone.replace(
            /\s/g,
            "",
        );

        const code = otp.join("");

        if (code.length !== 6) {
            setError(
                "Enter the complete 6-digit OTP.",
            );
            return;
        }

        setLoading(true);

        try {
            const { data } = await adminApi.post(
                "/auth/verify-otp",
                {
                    phone: cleanPhone,
                    otp: code,
                },
            );

            /*
             * IMPORTANT:
             * OTP verification alone does NOT
             * grant AdminDesk access.
             */
            if (data.user?.role !== "admin") {
                setError(
                    "This phone number is not authorized for AdminDesk.",
                );

                return;
            }

            localStorage.setItem(
                "tp_admin_token",
                data.token,
            );

            localStorage.setItem(
                "tp_admin_user",
                JSON.stringify(data.user),
            );

            setMessage(
                "Admin verification successful.",
            );

            setTimeout(() => {
                closeAdmin();
                navigate("/admin");
            }, 400);
        } catch (e) {
            setError(
                e.response?.data?.message ||
                "OTP verification failed.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <nav className="bottom">
                {items.map(
                    ([id, label, Icon]) => (
                        <button
                            key={id}
                            type="button"
                            className={`nav ${active === id
                                ? "active"
                                : ""
                                }`}
                            onClick={() => {
                                if (
                                    id === "admin"
                                ) {
                                    openAdmin();
                                    return;
                                }
                                if (id === "join") {
                                    setJoinModal(true);
                                    return;
                                }

                                if (id === "home") {
                                    navigate("/");
                                }

                            }}
                        >
                            <Icon size={21} />

                            <span
                                className="label"
                                style={{
                                    textTransform:
                                        "none",
                                    letterSpacing: 0,
                                }}
                            >
                                {label}
                            </span>
                        </button>
                    ),
                )}
            </nav>
            {joinModal && (
                <JoinRoomModal
                    onClose={() =>
                        setJoinModal(false)
                    }
                />
            )}

            {/* ADMIN LOGIN MODAL */}
            {adminModal && (
                <div
                    className="admin-login-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeAdmin();
                        }
                    }}
                >
                    <div
                        className="admin-login-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-login-title"
                    >
                        {/* HEADER */}
                        <div className="admin-login-header">
                            <div className="admin-login-icon">
                                <Shield size={21} />
                            </div>

                            <div>
                                <div className="admin-login-eyebrow">
                                    ADMIN DESK
                                </div>

                                <h2 id="admin-login-title">
                                    Administrator Login
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="admin-login-close"
                                onClick={
                                    closeAdmin
                                }
                                disabled={loading}
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="admin-login-body">
                            {!otpSent ? (
                                <>
                                    <p className="admin-login-description">
                                        Verify your
                                        authorized
                                        mobile number
                                        to access
                                        Tambola Pulse
                                        AdminDesk.
                                    </p>

                                    <label className="admin-login-label">
                                        <span>
                                            MOBILE
                                            NUMBER
                                        </span>

                                        <div className="admin-login-input-wrap">
                                            <Smartphone
                                                size={
                                                    16
                                                }
                                            />

                                            <input
                                                type="tel"
                                                inputMode="tel"
                                                autoFocus
                                                placeholder="+91 98765 43210"
                                                value={
                                                    phone
                                                }
                                                onChange={(
                                                    e,
                                                ) =>
                                                    setPhone(
                                                        e
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                onKeyDown={(
                                                    e,
                                                ) => {
                                                    if (
                                                        e.key ===
                                                        "Enter"
                                                    ) {
                                                        requestOTP();
                                                    }
                                                }}
                                            />
                                        </div>
                                    </label>

                                    <button
                                        type="button"
                                        className="admin-login-primary"
                                        onClick={
                                            requestOTP
                                        }
                                        disabled={
                                            loading
                                        }
                                    >
                                        {loading ? (
                                            <>
                                                <LoaderCircle
                                                    size={
                                                        16
                                                    }
                                                    className="spin"
                                                />
                                                REQUESTING OTP...
                                            </>
                                        ) : (
                                            <>
                                                <LockKeyhole
                                                    size={
                                                        16
                                                    }
                                                />
                                                REQUEST OTP
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="admin-login-phone">
                                        <Smartphone
                                            size={15}
                                        />

                                        <span>
                                            OTP sent to{" "}
                                            <strong>
                                                {phone}
                                            </strong>
                                        </span>
                                    </div>

                                    <label className="admin-login-label">
                                        <span>
                                            ENTER
                                            6-DIGIT OTP
                                        </span>

                                        <div className="admin-otp-grid">
                                            {otp.map(
                                                (
                                                    value,
                                                    index,
                                                ) => (
                                                    <input
                                                        key={
                                                            index
                                                        }
                                                        id={`admin-otp-${index}`}
                                                        type="text"
                                                        inputMode="numeric"
                                                        autoComplete="one-time-code"
                                                        maxLength={
                                                            1
                                                        }
                                                        value={
                                                            value
                                                        }
                                                        onChange={(
                                                            e,
                                                        ) =>
                                                            handleOtpChange(
                                                                index,
                                                                e
                                                                    .target
                                                                    .value,
                                                            )
                                                        }
                                                        onKeyDown={(
                                                            e,
                                                        ) => {
                                                            if (
                                                                e.key ===
                                                                "Backspace" &&
                                                                !value &&
                                                                index >
                                                                0
                                                            ) {
                                                                document
                                                                    .getElementById(
                                                                        `admin-otp-${index - 1}`,
                                                                    )
                                                                    ?.focus();
                                                            }
                                                        }}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </label>

                                    <button
                                        type="button"
                                        className="admin-login-primary"
                                        onClick={
                                            verifyOTP
                                        }
                                        disabled={
                                            loading
                                        }
                                    >
                                        {loading ? (
                                            <>
                                                <LoaderCircle
                                                    size={
                                                        16
                                                    }
                                                    className="spin"
                                                />
                                                VERIFYING...
                                            </>
                                        ) : (
                                            <>
                                                <Shield
                                                    size={
                                                        16
                                                    }
                                                />
                                                VERIFY & ENTER ADMIN
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        className="admin-login-resend"
                                        onClick={
                                            requestOTP
                                        }
                                        disabled={
                                            loading
                                        }
                                    >
                                        Resend OTP
                                    </button>
                                </>
                            )}

                            {devOtp && (
                                <div className="admin-dev-otp">
                                    <span>
                                        DEVELOPMENT
                                        OTP
                                    </span>

                                    <strong>
                                        {devOtp}
                                    </strong>
                                </div>
                            )}

                            {message && (
                                <div className="admin-login-message">
                                    <CheckCircle2
                                        size={15}
                                    />

                                    {message}
                                </div>
                            )}

                            {error && (
                                <div className="admin-login-error">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* FOOTER */}
                        <div className="admin-login-footer">
                            <Shield size={13} />

                            <span>
                                Authorized administrators
                                only
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}