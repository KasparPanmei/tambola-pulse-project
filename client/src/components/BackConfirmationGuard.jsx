import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, House } from "lucide-react";

// CHANGED: Defer history cleanup so React StrictMode's immediate effect replay can cancel it safely.
const pendingHistoryCleanup = new Map();

export default function BackConfirmationGuard({ active, onConfirm, children }) {
    const navigate = useNavigate();
    const [showPrompt, setShowPrompt] = useState(false);
    const marker = useRef(`tp-back-${Math.random().toString(36).slice(2)}`);
    const skipHistoryCleanup = useRef(false);

    useEffect(() => {
        const pendingTimer = pendingHistoryCleanup.get(marker.current);
        if (pendingTimer) {
            window.clearTimeout(pendingTimer);
            pendingHistoryCleanup.delete(marker.current);
        }
        if (!active) return undefined;

        const guardedUrl = window.location.href;
        const pushGuard = () => {
            if (window.history.state?.__tpBackGuard === marker.current) return;
            window.history.pushState(
                { ...(window.history.state || {}), __tpBackGuard: marker.current },
                "",
                window.location.href,
            );
        };

        // CHANGED: Push one marker only; the JoinRoomModal needs the prompt while open, including under StrictMode.
        pushGuard();
        const handlePopState = () => {
            setShowPrompt(true);
            pushGuard();
        };
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
            if (skipHistoryCleanup.current) {
                skipHistoryCleanup.current = false;
                return;
            }

            // CHANGED: Do not pop history during a route change; that stale async pop was opening a second prompt after room entry.
            const timer = window.setTimeout(() => {
                pendingHistoryCleanup.delete(marker.current);
                if (
                    window.location.href === guardedUrl &&
                    window.history.state?.__tpBackGuard === marker.current
                ) {
                    window.history.back();
                }
            }, 0);
            pendingHistoryCleanup.set(marker.current, timer);
        };
    }, [active]);

    function goHome() {
        setShowPrompt(false);
        // CHANGED: Confirmed exit owns the navigation; cleanup must not trigger another asynchronous Back event.
        skipHistoryCleanup.current = true;
        const pendingTimer = pendingHistoryCleanup.get(marker.current);
        if (pendingTimer) {
            window.clearTimeout(pendingTimer);
            pendingHistoryCleanup.delete(marker.current);
        }
        onConfirm?.();
        navigate("/", { replace: true });
    }

    return (
        <>
            {children}
            {showPrompt && (
                <div className="back-confirm-overlay" role="presentation">
                    <section
                        className="back-confirm-dialog"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="back-confirm-title"
                        aria-describedby="back-confirm-description"
                    >
                        <div className="back-confirm-icon"><ArrowLeft size={20} /></div>
                        <h2 id="back-confirm-title">Leave this flow?</h2>
                        <p id="back-confirm-description">
                            Do you want to go back to the main homepage? Your current progress will be left as it is.
                        </p>
                        <div className="back-confirm-actions">
                            <button type="button" className="back-stay-button" onClick={() => setShowPrompt(false)}>
                                No, wait
                            </button>
                            <button type="button" className="back-home-button" onClick={goHome}>
                                <House size={16} /> Yes, go home
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
