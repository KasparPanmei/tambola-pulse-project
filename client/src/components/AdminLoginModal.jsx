import { useEffect, useRef, useState } from "react";
import {
    ShieldCheck,
    Smartphone,
    LockKeyhole,
    X,
    ArrowRight,
    CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";

export default function AdminLoginModal({ onClose }) {
    const navigate = useNavigate();

    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState([
        "",
        "",
        "",
        "",
        "",
        "",
    ]);

    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const otpRefs = useRef([]);

    useEffect(() => {
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    function normalizePhone(value) {
        return value.replace(/[^\d+]/g, "");
    }

    async function requestOTP() {
        setError("");
        setMessage("");

        const normalized = normalizePhone(phone);

        if (!/^\+?[1-9]\d{9,14}$/.test(normalized)) {
            setError("Enter a valid mobile number.");
            return;
        }

        setLoading(true);

        try {
            const { data } = await api.post(
                "/auth/request-otp",
                {
                    phone: normalized,
                },
            );

            setPhone(normalized);
            setOtpSent(true);

            setMessage(
                data.devOtp
                    ? `Development OTP: ${data.devOtp}`
                    : "OTP sent to your mobile number.",
            );

            setTimeout(() => {
                otpRefs.current[0]?.focus();
            }, 100);
        } catch (e) {
            setError(
                e.response?.data?.message ||
                    "Could not send OTP.",
            );
        } finally {
            setLoading(false);
        }
    }

    async function verifyOTP() {
        setError("");
        setMessage("");

        const code = otp.join("");

        if (code.length !== 6) {
            setError("Enter the complete 6-digit OTP.");
            return;
        }

        setLoading(true);

        try {
            const { data } = await api.post(
                "/auth/verify-otp",
                {
                    phone,
                    otp: code,
                },
            );

            /*
             * The backend tells us whether this
             * verified account is actually an admin.
             */
            if (data.user?.role !== "admin") {
                localStorage.removeItem("tp_token");
                localStorage.removeItem("tp_user");

                setError(
                    "This mobile number is not registered as an administrator.",
                );

                return;
            }

            localStorage.setItem(
                "tp_token",
                data.token,
            );

            localStorage.setItem(
                "tp_user",
                JSON.stringify(data.user),
            );

            setMessage("Admin verification successful.");

            setTimeout(() => {
                onClose();
                navigate("/admin");
            }, 350);
        } catch (e) {
            setError(
                e.response?.data?.message ||
                    "OTP verification failed.",
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

        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    }

    function handleOtpKeyDown(index, event) {
        if (
            event.key === "Backspace" &&
            !otp[index] &&
            index > 0
        ) {
            otpRefs.current[index - 1]?.focus();
        }
    }

    return (
        <div
            className="admin-login-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="admin-login-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-login-title"
            >
                <button
                    className="admin-login-close"
                    onClick={onClose}
                    aria-label="Close admin login"
                >
                    <X size={18} />
                </button>

                <div className="admin-login-icon">
                    <ShieldCheck size={25} />
                </div>

                <div className="admin-login-heading">
                    <div className="admin-login-eyebrow">
                        RESTRICTED ACCESS
                    </div>

                    <h2 id="admin-login-title">
                        AdminDesk Login
                    </h2>

                    <p>
                        Verify your registered administrator
                        mobile number to continue.
                    </p>
                </div>

                <div className="admin-login-field">
                    <label>
                        <Smartphone size={14} />
                        ADMIN MOBILE NUMBER
                    </label>

                    <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={phone}
                        onChange={(event) => {
                            setPhone(event.target.value);
                            setError("");
                        }}
                        disabled={otpSent || loading}
                    />
                </div>

                {!otpSent && (
                    <button
                        className="admin-login-primary"
                        onClick={requestOTP}
                        disabled={loading}
                    >
                        <LockKeyhole size={16} />

                        {loading
                            ? "REQUESTING OTP..."
                            : "REQUEST OTP"}

                        <ArrowRight
                            size={16}
                            className="admin-login-arrow"
                        />
                    </button>
                )}

                {otpSent && (
                    <>
                        <div className="admin-login-otp-header">
                            <label>
                                ENTER 6-DIGIT OTP
                            </label>

                            <button
                                type="button"
                                onClick={requestOTP}
                                disabled={loading}
                            >
                                Resend OTP
                            </button>
                        </div>

                        <div className="admin-login-otp-grid">
                            {otp.map((value, index) => (
                                <input
                                    key={index}
                                    ref={(element) => {
                                        otpRefs.current[index] =
                                            element;
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={value}
                                    onChange={(event) =>
                                        handleOtpChange(
                                            index,
                                            event.target.value,
                                        )
                                    }
                                    onKeyDown={(event) =>
                                        handleOtpKeyDown(
                                            index,
                                            event,
                                        )
                                    }
                                />
                            ))}
                        </div>

                        <button
                            className="admin-login-primary"
                            onClick={verifyOTP}
                            disabled={loading}
                        >
                            <ShieldCheck size={16} />

                            {loading
                                ? "VERIFYING..."
                                : "VERIFY & ENTER ADMIN DESK"}

                            <ArrowRight
                                size={16}
                                className="admin-login-arrow"
                            />
                        </button>
                    </>
                )}

                {message && (
                    <div className="admin-login-message success">
                        <CheckCircle2 size={14} />
                        {message}
                    </div>
                )}

                {error && (
                    <div className="admin-login-message error">
                        {error}
                    </div>
                )}

                <div className="admin-login-security">
                    <ShieldCheck size={13} />

                    <span>
                        Admin access is restricted to
                        registered administrator numbers.
                    </span>
                </div>
            </div>
        </div>
    );
}