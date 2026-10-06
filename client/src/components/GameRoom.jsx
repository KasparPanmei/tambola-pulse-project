import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import ThemeSelector from "./ThemeSelector.jsx";

import {
    AlertCircle,
    Check,
    CheckCircle2,
    ChevronRight,
    CircleHelp,
    Clock3,
    Copy,
    Crown,
    Gift,
    LockKeyhole,
    Medal,
    Radio,
    ShieldCheck,
    Sparkles,
    Ticket,
    Trophy,
    Users,
    Volume2,
    VolumeX,
    WandSparkles,
    Zap,
    X,
} from "lucide-react";

import { toast } from "sonner";

const fallbackPrizes = [
    {
        id: "early-five",
        name: "Early Five",
        shortName: "Early 5",
        amount: 1000,
        reward: "₹1,000",
        detail: "First five marks on your ticket",
        accent: "coral",
    },
    {
        id: "top-line",
        name: "Top Line",
        shortName: "Top line",
        amount: 2000,
        reward: "₹2,000",
        detail: "Complete the top row",
        accent: "gold",
    },
    {
        id: "middle-line",
        name: "Middle Line",
        shortName: "Middle line",
        amount: 2000,
        reward: "₹2,000",
        detail: "Complete the middle row",
        accent: "mint",
    },
    {
        id: "bottom-line",
        name: "Bottom Line",
        shortName: "Bottom line",
        amount: 2000,
        reward: "₹2,000",
        detail: "Complete the bottom row",
        accent: "lilac",
    },
    {
        id: "four-corners",
        name: "Four Corners",
        shortName: "4 corners",
        amount: 3000,
        reward: "₹3,000",
        detail: "Mark the outside corners",
        accent: "gold",
    },
    {
        id: "full-house",
        name: "Full House",
        shortName: "Full house",
        amount: 5000,
        reward: "₹5,000",
        detail: "Mark all 15 numbers",
        accent: "coral",
    },
];



function normalizePrize(prize, index) {
    const amount = Number(
        prize?.amount ??
        prize?.prizeAmount ??
        prize?.reward ??
        0
    );

    return {
        id:
            prize?.id ||
            prize?._id ||
            `prize-${index + 1}`,

        name:
            prize?.name ||
            prize?.prizeName ||
            `Prize ${index + 1}`,

        shortName:
            prize?.shortName ||
            prize?.name ||
            `Prize ${index + 1}`,

        amount,

        reward:
            typeof prize?.reward === "string"
                ? prize.reward
                : `₹${amount.toLocaleString("en-IN")}`,

        detail:
            prize?.detail ||
            prize?.description ||
            "Complete the required pattern",

        accent:
            prize?.accent ||
            [
                "coral",
                "gold",
                "mint",
                "lilac",
            ][index % 4],

        winners:
            Number(prize?.winners) || 1,

        enabled:
            prize?.enabled !== false,

        // CHANGED: Preserve the server's room-level claimed flag so the prize table updates even before winner details load.
        claimed: prize?.claimed === true,
    };
}

function isMarked(value, calledNumbers) {
    return (
        value !== null &&
        value !== undefined &&
        Array.isArray(calledNumbers) &&
        calledNumbers.includes(Number(value))
    );
}


// CHANGED: Winner eligibility is evaluated only by the server draw engine; the player UI has no manual-claim path.

function SectionLabel({
    eyebrow,
    title,
    action,
}) {
    return (
        <div className="section-heading">
            <div>
                <p className="eyebrow">
                    {eyebrow}
                </p>

                <h2>{title}</h2>
            </div>

            {action}
        </div>
    );
}



function GameRoomHeader({
    room,
    player,
    status,
    playerCount,
    localMusicVolume,
    localMusicMuted,
    onLocalMusicVolumeChange,
    onToggleLocalMusicMute,
}) {
    const [musicControlsOpen, setMusicControlsOpen] = useState(false);
    const copyRoom = async () => {
        try {
            await navigator.clipboard?.writeText(
                room.code
            );

            toast.success(
                "Room code copied",
                {
                    description:
                        `Share ${room.code} with your players.`,
                }
            );
        } catch {
            toast.error(
                "Unable to copy room code"
            );
        }
    };

    return (
        <header className="topbar">
            <div className="brand-lockup">
                <div className="brand-mark">
                    <Ticket
                        size={18}
                        strokeWidth={2.5}
                    />
                </div>

                <div>
                    <div className="brand-name">
                        Tambola{" "}
                        <span>
                            Pulse
                        </span>
                    </div>

                    <div className="brand-subtitle">
                        {room?.title ||
                            "Game Room"}
                    </div>
                </div>
            </div>

            <div className="topbar-meta">
                <div
                    className="room-code"
                    role="button"
                    tabIndex={0}
                    onClick={copyRoom}
                    onKeyDown={(event) => {
                        if (
                            event.key ===
                            "Enter"
                        ) {
                            copyRoom();
                        }
                    }}
                >
                    <span className="meta-label">
                        ROOM CODE
                    </span>

                    <strong>
                        {room?.code}
                    </strong>

                    <Copy size={13} />
                </div>

                <div className="divider" />

                <div className="live-status">
                    <span
                        className={`live-dot ${status ===
                            "paused"
                            ? "paused"
                            : ""
                            }`}
                    />

                    {status ===
                        "live"
                        ? "Live now"
                        : status ===
                            "upcoming"
                            ? "Waiting to start"
                            : status ===
                                "closed"
                                ? "Game ended"
                                : "Paused"}
                </div>

                <div className="player-count">
                    <Users size={15} />

                    {playerCount} playing
                </div>

                {/* CHANGED: The game-room navigation shares the same saved theme selector as Home. */}
                <ThemeSelector />

                {/* ADDED: Let each player mute or lower room music on their own device. */}
                <div className="room-music-volume-control">
                    <button
                        type="button"
                        className="icon-button room-music-volume-button"
                        aria-label="Open room music volume controls"
                        aria-expanded={musicControlsOpen}
                        onClick={() => setMusicControlsOpen((open) => !open)}
                        title="Room music volume"
                    >
                        {localMusicMuted || localMusicVolume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
                            </button>
                            {musicControlsOpen && (
                                <div className="room-music-volume-popover" role="group" aria-label="Room music volume controls">
                                    <strong>Room music</strong>
                                    <button type="button" className="room-music-mute-button" onClick={onToggleLocalMusicMute}>
                                        {localMusicMuted || localMusicVolume === 0 ? "Turn music on" : "Mute music"}
                            </button>
                            <label htmlFor="player-room-music-volume">This device</label>
                            <div className="room-music-volume-row">
                                <input
                                    id="player-room-music-volume"
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={Math.round(localMusicVolume * 100)}
                                    onChange={(event) => onLocalMusicVolumeChange(Number(event.target.value) / 100)}
                                    aria-label="Music volume on this device"
                                />
                                <span>{Math.round(localMusicVolume * 100)}%</span>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    className="icon-button"
                    aria-label="Room help"
                    onClick={() =>
                        toast.info(
                            "Room Help",
                            {
                                description:
                                    "Numbers are called automatically. Your paid tickets are checked for prize patterns and eligible prizes are claimed automatically—no claim button is needed.",
                            }
                        )
                    }
                >
                    <CircleHelp
                        size={17}
                    />
                </button>

                <div className="host-avatar">
                    {(
                        player?.name ||
                        "P"
                    )
                        .split(" ")
                        .map(
                            (part) =>
                                part[0]
                        )
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                </div>
            </div>
        </header>
    );
}



function NumberCaller({
    currentNumber,
    calledNumbers,
    status,
    voiceEnabled,
    onToggleVoice,
    callCadence,
    lastCalledAt,
}) {
    const latestNumbers = [
        ...(calledNumbers || []),
    ]
        .reverse()
        .slice(0, 5);

    const [
        secondsRemaining,
        setSecondsRemaining,
    ] = useState(0);

    /*
     * Countdown is only visual.
     *
     * It DOES NOT call a number.
     * The server game engine is responsible
     * for calling the next number.
     */
    useEffect(() => {
        if (
            status !== "live" ||
            !lastCalledAt
        ) {
            setSecondsRemaining(0);
            return undefined;
        }

        const cadence =
            Number(callCadence) || 5;

        const updateCountdown = () => {
            const lastCall =
                new Date(
                    lastCalledAt
                ).getTime();

            if (
                !Number.isFinite(
                    lastCall
                )
            ) {
                setSecondsRemaining(
                    cadence
                );
                return;
            }

            const elapsed =
                Date.now() -
                lastCall;

            const remaining =
                Math.max(
                    0,
                    Math.ceil(
                        (
                            cadence *
                            1000 -
                            elapsed
                        ) /
                        1000
                    )
                );

            setSecondsRemaining(
                remaining
            );
        };

        updateCountdown();

        const timer =
            window.setInterval(
                updateCountdown,
                250
            );

        return () =>
            window.clearInterval(
                timer
            );
    }, [
        status,
        callCadence,
        lastCalledAt,
    ]);

    return (
        <section className="caller-card panel-card">
            <div className="caller-header">
                <div>
                    <div className="eyebrow with-icon">
                        <span className="caller-live-dot" />

                        LIVE GAME
                    </div>
                </div>

                <div className="caller-actions">
                    <span className="next-cue">
                        <Radio size={13} />

                        {status ===
                            "live"
                            ? lastCalledAt
                                ? `Next cue in ${secondsRemaining}s`
                                : "Calling first cue..."
                            : status ===
                                "upcoming"
                                ? "Game has not started"
                                : status ===
                                    "closed"
                                    ? "Game ended"
                                    : "Game paused"}
                    </span>
                </div>
            </div>

            <div className="caller-stage">
                <div
                    className="number-orb"
                    aria-live="polite"
                >
                    <strong>
                        {currentNumber ??
                            "—"}
                    </strong>
                </div>
            </div>

            <div className="recent-calls caller-history">
                <span className="recent-label">
                    PREVIOUS CUES
                </span>

                <div className="recent-pills">
                    {latestNumbers.map(
                        (
                            number,
                            index
                        ) => (
                            <span
                                className={`recent-pill ${index ===
                                    0
                                    ? "current"
                                    : ""
                                    }`}
                                key={`${number}-${index}`}
                            >
                                {number}
                            </span>
                        )
                    )}

                    {latestNumbers.length <
                        5 &&
                        Array.from({
                            length:
                                5 -
                                latestNumbers.length,
                        }).map(
                            (
                                _,
                                index
                            ) => (
                                <span
                                    className="recent-pill empty"
                                    key={`empty-${index}`}
                                >
                                    —
                                </span>
                            )
                        )}
                </div>

                <button
                    type="button"
                    className={`voice-note voice-toggle ${voiceEnabled
                        ? "enabled"
                        : ""
                        }`}
                    onClick={
                        onToggleVoice
                    }
                >
                    <Volume2
                        size={13}
                    />

                    {voiceEnabled
                        ? "Voice Caller ON"
                        : "Enable voice caller"}
                </button>
            </div>

            <div className="caller-footer">
                <span className="text-button">
                    <Radio
                        size={13}
                    />

                    Server-controlled automatic caller
                </span>
            </div>
        </section>
    );
}


function NumberBoard({
    calledNumbers,
}) {
    const numbers = Array.isArray(
        calledNumbers
    )
        ? calledNumbers
        : [];

    const latestNumber =
        numbers.at(-1) ?? null;

    return (
        <section className="number-board-card panel-card">
            <SectionLabel
                eyebrow="THE CALL BOARD"
                title="Numbers in play"
                action={
                    <span className="board-count">
                        {numbers.length}{" "}
                        called
                    </span>
                }
            />

            <div
                className="number-grid"
                aria-label="Numbers 1 to 90"
            >
                {Array.from(
                    { length: 90 },
                    (_, index) =>
                        index + 1
                ).map(
                    (number) => (
                        <span
                            key={
                                number
                            }
                            className={`board-number ${numbers.includes(
                                number
                            )
                                ? "called"
                                : ""
                                } ${latestNumber ===
                                    number
                                    ? "latest"
                                    : ""
                                }`}
                        >
                            {number}
                        </span>
                    )
                )}
            </div>
        </section>
    );
}



function TambolaTicket({
    ticket,
    calledNumbers,
    ticketNumber,
}) {
    const markedCount =
        Array.isArray(ticket)
            ? ticket
                .flat()
                .filter(
                    (value) =>
                        isMarked(
                            value,
                            calledNumbers
                        )
                ).length
            : 0;

    return (
        <section className="ticket-card panel-card">
            <div className="ticket-topline">
                <div>
                    <div className="eyebrow with-icon">
                        <Ticket
                            size={14}
                        />

                        YOUR TICKET
                    </div>

                    <h2>
                        Lucky ticket{" "}
                        <span>
                            #
                            {
                                ticketNumber
                            }
                        </span>
                    </h2>
                </div>

                <div className="ticket-progress">
                    <strong>
                        {
                            markedCount
                        }
                    </strong>
                    /15 marked{" "}
                    <CheckCircle2
                        size={15}
                    />
                </div>
            </div>

            <div className="ticket-note">
                <Sparkles
                    size={15}
                />

                Numbers are automatically marked
                when called by the server.
            </div>

            <div
                className="ticket-grid"
                role="grid"
                aria-label="Your Tambola ticket"
            >
                {Array.isArray(
                    ticket
                ) &&
                    ticket.flatMap(
                        (
                            row,
                            rowIndex
                        ) =>
                            Array.isArray(
                                row
                            )
                                ? row.map(
                                    (
                                        value,
                                        columnIndex
                                    ) => {
                                        const marked =
                                            isMarked(
                                                value,
                                                calledNumbers
                                            );

                                        return (
                                            <div
                                                className={`ticket-cell ${value ===
                                                    null
                                                    ? "blank"
                                                    : "filled"
                                                    } ${marked
                                                        ? "marked"
                                                        : ""
                                                    }`}
                                                key={`${rowIndex}-${columnIndex}`}
                                                role="gridcell"
                                                aria-label={
                                                    value ===
                                                        null
                                                        ? "Empty ticket cell"
                                                        : `${value}${marked
                                                            ? ", marked"
                                                            : ""
                                                        }`
                                                }
                                            >
                                                {value !==
                                                    null && (
                                                        <>
                                                            <span>
                                                                {
                                                                    value
                                                                }
                                                            </span>

                                                            {marked && (
                                                                <Check
                                                                    size={
                                                                        15
                                                                    }
                                                                    strokeWidth={
                                                                        3
                                                                    }
                                                                />
                                                            )}
                                                        </>
                                                    )}
                                            </div>
                                        );
                                    }
                                )
                                : []
                    )}
            </div>

            <div className="ticket-footer">
                <span>
                    <span className="legend-dot marked-dot" />

                    Called & marked
                </span>

                <span>
                    <span className="legend-dot waiting-dot" />

                    Waiting
                </span>

                <span className="ticket-serial">
                    {ticketNumber}
                </span>
            </div>
        </section>
    );
}


// CHANGED: Render automatic server-awarded prize state only; player claim actions are removed.
function PrizePanel({ room, winners = [] }) {
    const prizes =
        Array.isArray(room?.prizes) && room.prizes.length
            ? room.prizes.filter((prize) => prize?.enabled !== false).map(normalizePrize)
            : fallbackPrizes;

    return (
        <section className="prize-card panel-card">
            <SectionLabel
                eyebrow="WHAT'S AT STAKE"
                title="Prizes"
                action={
                    <span className="prize-total">
                        <Gift size={14} />
                        ₹{Number(
                            room?.jackpot || prizes.reduce((total, prize) => total + Number(prize.amount || 0), 0),
                        ).toLocaleString("en-IN")} total
                    </span>
                }
            />

            <div className="prize-list">
                {prizes.map((prize, index) => {
                    const winner = winners.find(
                        (item) => String(item?.prizeId) === String(prize.id),
                    );
                    const claimed = Boolean(prize.claimed || winner);
                    const status = claimed ? "claimed" : "locked";
                    const winnerTicket = winner?.ticketId || winner?.ticketNumber;

                    return (
                        <div className={`prize-row ${status} accent-${prize.accent}`} key={prize.id}>
                            <div className="prize-icon">
                                {index === prizes.length - 1 ? <Crown size={17} /> : index === 0 ? <Zap size={17} /> : <Trophy size={17} />}
                            </div>
                            <div className="prize-info">
                                <strong>{prize.name}</strong>
                                <span>{prize.detail}</span>
                            </div>
                            <div className="prize-reward">
                                <strong>{prize.reward}</strong>
                                {claimed ? (
                                    <span className="claimed-label" title={winner ? `${winner.userName || "Player"} • Ticket ${winnerTicket || "—"}` : "Winner recorded"}>
                                        <CheckCircle2 size={13} />
                                        Claimed{winnerTicket ? ` • Ticket ${winnerTicket}` : ""}
                                    </span>
                                ) : (
                                    <span className="locked-label"><LockKeyhole size={12} /> Waiting</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CHANGED: Explain that winners are assigned automatically, one ticket per prize. */}
            <div className="claim-disclaimer">
                <ShieldCheck size={15} />
                <span>Prizes are claimed automatically when a paid ticket completes the pattern. Only one ticket can win each prize.</span>
            </div>
        </section>
    );
}

// CHANGED: Show a celebratory confetti popup with the exact prize name for a verified player win.
function WinnerCelebration({ winner, onClose }) {
    if (!winner) return null;
    const confetti = Array.from({ length: 34 }, (_, index) => index);

    return (
        <div className="winner-celebration-overlay" role="dialog" aria-modal="true" aria-labelledby="winner-celebration-title">
            <div className="winner-confetti" aria-hidden="true">
                {confetti.map((piece) => <span key={piece} style={{ "--confetti-index": piece }} />)}
            </div>
            <section className="winner-celebration-modal">
                <button type="button" className="winner-celebration-close" onClick={onClose} aria-label="Close winner notification">
                    <X size={18} />
                </button>
                <div className="winner-trophy-burst"><Trophy size={30} /></div>
                <p className="winner-celebration-kicker">WINNER ALERT</p>
                <h2 id="winner-celebration-title">You've won a prize!</h2>
                <p className="winner-celebration-prize">{winner.prizeName}</p>
                <p className="winner-celebration-copy">
                    Your ticket has been verified for this prize. Congratulations on the win!
                </p>
                <button type="button" className="winner-celebration-button" onClick={onClose}>Continue playing</button>
            </section>
        </div>
    );
}

// ADDED: Require every player to acknowledge the game end and announce the Full House winner.
function GameEndedCelebration({ winner, onLeave }) {
    if (!winner) return null;
    return (
        <div className="game-ended-overlay" role="dialog" aria-modal="true" aria-labelledby="game-ended-title">
            <section className="game-ended-modal">
                <div className="winner-trophy-burst"><Trophy size={30} /></div>
                <p className="winner-celebration-kicker">FULL HOUSE</p>
                <h2 id="game-ended-title">Full House has been won!</h2>
                <p className="game-ended-winner">{winner.name || "Player"}</p>
                <p className="game-ended-copy">The game has ended. Please leave the room to continue.</p>
                <button type="button" className="winner-celebration-button" onClick={onLeave}>Leave room</button>
            </section>
        </div>
    );
}


function Leaderboard({
    entries,
}) {
    return (
        <section className="leaderboard-card panel-card">
            <SectionLabel
                eyebrow="WINNERS CIRCLE"
                title="Leaderboard"
                action={
                    <button
                        type="button"
                        className="see-all"
                        onClick={() =>
                            toast.info(
                                "Leaderboard",
                                {
                                    description:
                                        "Verified winners will appear here.",
                                }
                            )
                        }
                    >
                        View all{" "}
                        <ChevronRight
                            size={14}
                        />
                    </button>
                }
            />

            <div className="leaderboard-list">
                {entries.length ===
                    0 ? (
                    <div className="empty-room-state">
                        <Medal
                            size={20}
                        />

                        <span>
                            No winners yet.
                        </span>

                        <small>
                            Verified winners will
                            appear here.
                        </small>
                    </div>
                ) : (
                    entries.map(
                        (
                            entry,
                            index
                        ) => (
                            <div
                                className="leaderboard-row"
                                key={`${entry.player}-${entry.prize}-${index}`}
                            >
                                <div
                                    className={`rank-badge rank-${index +
                                        1
                                        }`}
                                >
                                    {index ===
                                        0 ? (
                                        <Crown
                                            size={
                                                14
                                            }
                                        />
                                    ) : (
                                        index +
                                        1
                                    )}
                                </div>

                                <div
                                    className={`player-avatar ${entry.accent ||
                                        "sunset"
                                        }`}
                                >
                                    {
                                        entry.initials
                                    }
                                </div>

                                <div className="winner-info">
                                    <strong>
                                        {
                                            entry.player
                                        }
                                    </strong>

                                    <span>
                                        {
                                            entry.prize
                                        }
                                    </span>
                                </div>

                                <span className="winner-time">
                                    {
                                        entry.time
                                    }
                                </span>
                            </div>
                        )
                    )
                )}
            </div>

            <div className="leaderboard-footer">
                <Medal
                    size={15}
                />

                <span>
                    Winners are added after
                    verified claims.
                </span>
            </div>
        </section>
    );
}

function ActivityFeed({
    items,
}) {
    return (
        <section className="activity-card panel-card">
            <SectionLabel
                eyebrow="ROOM PULSE"
                title="Activity"
                action={
                    <span className="live-mini">
                        <span className="live-dot" />

                        Live
                    </span>
                }
            />

            <div className="activity-list">
                {items.length ===
                    0 ? (
                    <div className="empty-room-state">
                        <Radio
                            size={20}
                        />

                        <span>
                            Waiting for game
                            activity.
                        </span>
                    </div>
                ) : (
                    items
                        .slice(
                            0,
                            6
                        )
                        .map(
                            (
                                item,
                                index
                            ) => (
                                <div
                                    className="activity-row"
                                    key={`${item.title}-${item.time}-${index}`}
                                >
                                    <div
                                        className={`activity-icon ${item.icon}`}
                                    >
                                        {item.icon ===
                                            "call" ? (
                                            <Radio
                                                size={
                                                    14
                                                }
                                            />
                                        ) : item.icon ===
                                            "claim" ? (
                                            <Trophy
                                                size={
                                                    14
                                                }
                                            />
                                        ) : (
                                            <Sparkles
                                                size={
                                                    14
                                                }
                                            />
                                        )}
                                    </div>

                                    <div className="activity-copy">
                                        <strong>
                                            {
                                                item.title
                                            }
                                        </strong>

                                        <span>
                                            {
                                                item.detail
                                            }
                                        </span>
                                    </div>

                                    <span className="activity-time">
                                        {
                                            item.time
                                        }
                                    </span>
                                </div>
                            )
                        )
                )}
            </div>
        </section>
    );
}



export default function GameRoom({
    room,
    tickets = [],
    player = null,
}) {
    const navigate = useNavigate();
    /*
     * Only valid ticket grids are used for
     * eligibility calculations.
     */
    /*
     * Server-authoritative game state.
     */
    const [
        gameState,
        setGameState,
    ] = useState(() => ({
        status:
            room?.status ||
            "upcoming",

        currentNumber:
            room?.currentNumber ??
            null,

        calledNumbers:
            Array.isArray(
                room?.calledNumbers
            )
                ? room.calledNumbers
                : [],

        callCadence:
            Number(
                room?.callCadence
            ) || 5,

        autoCaller:
            Boolean(
                room?.autoCaller
            ),

        lastCalledAt:
            room?.lastCalledAt ||
            null,

        gameStartedAt:
            room?.gameStartedAt ||
            null,

        gameVersion:
            Number(
                room?.gameVersion
            ) || 0,

        prizes:
            Array.isArray(
                room?.prizes
            )
                ? room.prizes
                : [],
        // ADDED: Room-synchronized background-music metadata.
        musicUrl: room?.musicUrl || "",
        musicTitle: room?.musicTitle || "",
        musicPlaying: Boolean(room?.musicPlaying),
        musicUpdatedAt: room?.musicUpdatedAt || null,
        // ADDED: Shared seek/resume offset for the room's current track.
        musicPosition: Number(room?.musicPosition) || 0,
        // ADDED: Admin-controlled room-wide music volume; player-local volume remains independent.
        musicVolume: Number.isFinite(Number(room?.musicVolume)) ? Math.max(0, Math.min(1, Number(room.musicVolume))) : 1,
    }));

    /*
     * Keep local state synchronized with
     * the initial/parent room object.
     */
    useEffect(() => {
        setGameState(
            (previous) => ({
                ...previous,

                status:
                    room?.status ||
                    "upcoming",

                currentNumber:
                    room?.currentNumber ??
                    null,

                calledNumbers:
                    Array.isArray(
                        room?.calledNumbers
                    )
                        ? room.calledNumbers
                        : [],

                callCadence:
                    Number(
                        room?.callCadence
                    ) ||
                    previous.callCadence ||
                    5,

                autoCaller:
                    Boolean(
                        room?.autoCaller
                    ),

                lastCalledAt:
                    room?.lastCalledAt ||
                    null,

                gameStartedAt:
                    room?.gameStartedAt ||
                    null,

                gameVersion:
                    Number(
                        room?.gameVersion
                    ) ||
                    0,

                prizes:
                    Array.isArray(
                        room?.prizes
                    )
                        ? room.prizes
                        : previous.prizes ||
                        [],
                // ADDED: Keep background music synchronized with the current room.
                musicUrl: room?.musicUrl || "",
                musicTitle: room?.musicTitle || "",
                musicPlaying: Boolean(room?.musicPlaying),
                musicUpdatedAt: room?.musicUpdatedAt || null,
                // ADDED: Keep the player's track position aligned with the room state.
                musicPosition: Number(room?.musicPosition) || 0,
                // ADDED: Keep the shared admin volume in sync with room data.
                musicVolume: Number.isFinite(Number(room?.musicVolume)) ? Math.max(0, Math.min(1, Number(room.musicVolume))) : 1,
            })
        );
    }, [
        room?.status,
        room?.currentNumber,
        room?.calledNumbers,
        room?.callCadence,
        room?.autoCaller,
        room?.lastCalledAt,
        room?.gameStartedAt,
        room?.gameVersion,
        room?.prizes,
        room?.musicUrl,
        room?.musicTitle,
        room?.musicPlaying,
        room?.musicUpdatedAt,
        room?.musicPosition,
        room?.musicVolume,
    ]);

    /*
     * Voice caller.
     */
    const [
        voiceEnabled,
        setVoiceEnabled,
    // MODIFIED: Spoken number calling is enabled automatically on room entry.
    ] = useState(true);

    const [
        serverWinners,
        setServerWinners,
    ] = useState([]);
    // CHANGED: Track the latest personal winner so the popup is shown once per winning claim.
    const [winnerCelebration, setWinnerCelebration] = useState(null);
    const seenWinnerIds = useRef(new Set());
    // ADDED: Shared full-house result and background audio element.
    const [gameEndWinner, setGameEndWinner] = useState(room?.fullHouseWinner || null);
    const backgroundMusicRef = useRef(null);
    // ADDED: Player-local audio controls do not change the admin's shared master volume.
    const [localMusicVolume, setLocalMusicVolume] = useState(1);
    const [localMusicMuted, setLocalMusicMuted] = useState(false);

    /*
     * Player count.
     */
    const [
        playerCount,
        setPlayerCount,
    ] = useState(
        room?.playerCount || 1
    );

    /*
     * Activity.
     */
    const [
        activity,
        setActivity,
    ] = useState([]);

    /*
     * Derived game values.
     */
    const status =
        gameState.status;

    const calledNumbers =
        Array.isArray(
            gameState.calledNumbers
        )
            ? gameState.calledNumbers
            : [];

    const currentNumber =
        gameState.currentNumber ??
        calledNumbers.at(-1) ??
        null;

    const callCadence =
        Number(
            gameState.callCadence
        ) || 5;

    const autoCaller =
        Boolean(
            gameState.autoCaller
        );

    const lastCalledAt =
        gameState.lastCalledAt ||
        null;


    useEffect(() => {
        if (!room?.code) {
            return undefined;
        }

        let cancelled = false;

        const syncGameRoom =
            async () => {
                try {
                    const {
                        data,
                    } =
                        await api.get(
                            `/rooms/${encodeURIComponent(
                                room.code
                            )}/state`
                        );

                    if (
                        cancelled
                    ) {
                        return;
                    }

                    const nextRoom =
                        data?.room ||
                        {};

                    // ADDED: Announce full-house closure to all players before they leave the room.
                    if (nextRoom.status === "closed" && !nextRoom.fullHouseWinner) {
                        toast.info("This room has ended", {
                            description: "Returning to the homepage to find the current room.",
                        });
                        navigate("/", { replace: true });
                        return;
                    }
                    if (nextRoom.status === "closed" && nextRoom.fullHouseWinner) {
                        setGameEndWinner(nextRoom.fullHouseWinner);
                    }

                    const nextCalledNumbers =
                        Array.isArray(
                            nextRoom.calledNumbers
                        )
                            ? nextRoom.calledNumbers
                            : [];

                    const nextCurrentNumber =
                        nextRoom.currentNumber ??
                        nextCalledNumbers.at(
                            -1
                        ) ??
                        null;

                    setGameState({
                        status:
                            nextRoom.status ||
                            "upcoming",

                        currentNumber:
                            nextCurrentNumber,

                        calledNumbers:
                            nextCalledNumbers,

                        callCadence:
                            Number(
                                nextRoom.callCadence
                            ) || 5,

                        autoCaller:
                            Boolean(
                                nextRoom.autoCaller
                            ),

                        lastCalledAt:
                            nextRoom.lastCalledAt ||
                            null,

                        gameStartedAt:
                            nextRoom.gameStartedAt ||
                            null,

                        gameVersion:
                            Number(
                                nextRoom.gameVersion
                            ) || 0,

                        prizes:
                            Array.isArray(
                                nextRoom.prizes
                            )
                                ? nextRoom.prizes
                                : [],
                        // ADDED: Apply admin music controls received through room-state polling.
                        musicUrl: nextRoom.musicUrl || "",
                        musicTitle: nextRoom.musicTitle || "",
                        musicPlaying: Boolean(nextRoom.musicPlaying),
                        musicUpdatedAt: nextRoom.musicUpdatedAt || null,
                        // ADDED: Receive seek/resume position for room-wide playback.
                        musicPosition: Number(nextRoom.musicPosition) || 0,
                        // ADDED: Receive the admin's shared music volume on each room-state refresh.
                        musicVolume: Number.isFinite(Number(nextRoom.musicVolume)) ? Math.max(0, Math.min(1, Number(nextRoom.musicVolume))) : 1,
                    });

                    setServerWinners(
                        Array.isArray(
                            data?.winners
                        )
                            ? data.winners
                            : []
                    );
                } catch (error) {
                    if (
                        !cancelled
                    ) {
                        console.error(
                            "GameRoom sync failed:",
                            error
                                .response
                                ?.data
                                ?.message ||
                            error.message
                        );
                    }
                }
            };

        /*
         * Fetch immediately.
         */
        syncGameRoom();

        /*
         * Continue synchronization.
         */
        const interval =
            window.setInterval(
                syncGameRoom,
                1000
            );

        return () => {
            cancelled = true;

            window.clearInterval(
                interval
            );
        };
    }, [room?.code, navigate]);

    // ADDED: Play the admin-selected room track and align players to its shared start time.
    useEffect(() => {
        const audio = backgroundMusicRef.current;
        if (!audio) return;
        const configuredApi = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const apiOrigin = new URL(configuredApi, window.location.origin);
        const source = gameState.musicUrl ? new URL(gameState.musicUrl, apiOrigin).href : "";
        const sharedVolume = Number.isFinite(Number(gameState.musicVolume)) ? Math.max(0, Math.min(1, Number(gameState.musicVolume))) : 1;
        audio.volume = localMusicMuted ? 0 : sharedVolume * localMusicVolume;

        if (!source) {
            audio.pause();
            audio.removeAttribute("src");
            return;
        }
        if (audio.src !== source) {
            audio.src = source;
            audio.load();
        }
        if (gameState.musicPlaying) {
            const alignAudio = () => {
                if (!gameState.musicUpdatedAt) return;
                const elapsed = Math.max(0, (Date.now() - new Date(gameState.musicUpdatedAt).getTime()) / 1000);
                const trackPosition = Math.max(0, Number(gameState.musicPosition) || 0) + elapsed;
                const target = Number.isFinite(audio.duration) && audio.duration > 0 ? trackPosition % audio.duration : trackPosition;
                if (Number.isFinite(target) && Math.abs(audio.currentTime - target) > 0.75) {
                    try { audio.currentTime = target; } catch { /* metadata is not ready yet */ }
                }
            };
            if (audio.readyState >= 1) alignAudio();
            else audio.addEventListener("loadedmetadata", alignAudio, { once: true });
            audio.play()?.catch(() => {});
            return () => audio.removeEventListener("loadedmetadata", alignAudio);
        } else {
            audio.pause();
            // ADDED: Apply paused seeks too, so the next Play resumes from the admin-selected point.
            const restorePausedPosition = () => {
                const saved = Math.max(0, Number(gameState.musicPosition) || 0);
                const target = Number.isFinite(audio.duration) && audio.duration > 0
                    ? Math.min(saved, audio.duration)
                    : saved;
                if (Math.abs(audio.currentTime - target) > 0.75) {
                    try { audio.currentTime = target; } catch { /* metadata is not ready yet */ }
                }
            };
            if (audio.readyState >= 1) restorePausedPosition();
            else audio.addEventListener("loadedmetadata", restorePausedPosition, { once: true });
            return () => audio.removeEventListener("loadedmetadata", restorePausedPosition);
        }
    }, [gameState.musicUrl, gameState.musicPlaying, gameState.musicUpdatedAt, gameState.musicPosition, gameState.musicVolume, localMusicVolume, localMusicMuted]);

    /*
     * Player count.
     */
    useEffect(() => {
        if (
            typeof room?.playerCount ===
            "number"
        ) {
            setPlayerCount(
                room.playerCount
            );
        }
    }, [
        room?.playerCount,
    ]);

    /*
     * Initial activity.
     */
    useEffect(() => {
        if (!room?.code) {
            return;
        }

        setActivity([
            {
                icon: "system",
                title: "Room joined",
                detail:
                    `You joined ${room.code}`,
                time: "Just now",
            },
        ]);
    }, [room?.code]);

    /*
     * Build activity from the server's
     * actual called numbers.
     */
    useEffect(() => {
        if (
            !calledNumbers.length
        ) {
            return;
        }

        const recentCalls =
            [...calledNumbers]
                .reverse()
                .slice(0, 6);

        setActivity(
            (items) => {
                const nonCallItems =
                    items.filter(
                        (item) =>
                            item.icon !==
                            "call"
                    );

                const callItems =
                    recentCalls.map(
                        (number) => {
                            const matchingTickets =
                                tickets.filter(
                                    (ticket) =>
                                        Array.isArray(
                                            ticket?.grid
                                        ) &&
                                        ticket.grid
                                            .flat()
                                            .includes(
                                                number
                                            )
                                ).length;

                            const matchDetail =
                                matchingTickets ===
                                    0
                                    ? "No number match on your tickets"
                                    : matchingTickets ===
                                        1
                                        ? "Number matched your ticket"
                                        : `${matchingTickets} tickets matched`;

                            return {
                                icon: "call",
                                title:
                                    `Number ${number} called`,
                                detail:
                                    matchDetail,
                                time:
                                    number ===
                                        currentNumber
                                        ? "Just now"
                                        : "Called",
                            };
                        }
                    );

                return [
                    ...callItems,
                    ...nonCallItems,
                ].slice(0, 6);
            }
        );
    }, [
        calledNumbers,
        currentNumber,
        tickets,
    ]);

    /*
     * Announce ONLY a newly received
     * server number.
     */
    useEffect(() => {
        if (
            !currentNumber ||
            !calledNumbers.length
        ) {
            return;
        }

        if (
            !voiceEnabled ||
            !("speechSynthesis" in window)
        ) {
            return;
        }

        window.speechSynthesis.cancel();

        const announcement =
            new SpeechSynthesisUtterance(
                `Number ${currentNumber}`
            );

        announcement.rate = 0.86;
        announcement.pitch = 1;
        announcement.volume = 1;

        window.speechSynthesis.speak(
            announcement
        );
    }, [
        currentNumber,
        calledNumbers.length,
        voiceEnabled,
    ]);

    /*
     * Voice toggle.
     */
    function handleToggleVoice() {
        const nextEnabled =
            !voiceEnabled;

        setVoiceEnabled(
            nextEnabled
        );

        if (
            nextEnabled &&
            "speechSynthesis" in
            window
        ) {
            window.speechSynthesis.cancel();

            const announcement =
                new SpeechSynthesisUtterance(
                    "Voice caller enabled"
                );

            announcement.rate =
                0.9;

            announcement.volume =
                1;

            window.speechSynthesis.speak(
                announcement
            );

            toast.success(
                "Voice caller enabled"
            );
        } else if (
            "speechSynthesis" in
            window
        ) {
            window.speechSynthesis.cancel();

            toast.info(
                "Voice caller paused"
            );
        }
    }


    // CHANGED: Manual player claims were removed; the server awards prizes after each called number.

    useEffect(() => {
        if (
            !serverWinners.length
        ) {
            return;
        }

        setActivity(
            (items) => {
                const winnerItems =
                    serverWinners.map(
                        (winner) => ({
                            icon: "claim",
                            title:
                                `${winner.prizeName} won`,
                            detail:
                                `${winner.userName || "Player"} • Ticket ${winner.ticketId || winner.ticketNumber || "—"}`,
                            time:
                                winner.verifiedAt
                                    ? new Date(
                                        winner.verifiedAt
                                    ).toLocaleTimeString(
                                        "en-IN",
                                        {
                                            hour:
                                                "2-digit",
                                            minute:
                                                "2-digit",
                                        }
                                    )
                                    : "Verified",
                        })
                    );

                const nonWinnerItems =
                    items.filter(
                        (item) =>
                            item.icon !==
                            "claim"
                    );

                return [
                    ...winnerItems,
                    ...nonWinnerItems,
                ].slice(0, 6);
            }
        );
    }, [
        serverWinners,
    ]);

    // CHANGED: Match server-awarded winners to this player's registered ticket IDs.
    useEffect(() => {
        if (!serverWinners.length || !tickets.length) return;
        const playerTicketIds = new Set(
            tickets.flatMap((ticket) => [ticket?._id, ticket?.id, ticket?.publicCode, ticket?.number]
                .filter((value) => value !== null && value !== undefined)
                .map(String)),
        );
        const personalWinner = [...serverWinners].reverse().find((winner) => {
            const winnerTicketId = winner?.ticketId ?? winner?.ticketNumber;
            return winnerTicketId !== null && winnerTicketId !== undefined
                && playerTicketIds.has(String(winnerTicketId))
                && !seenWinnerIds.current.has(String(winner.id));
        });
        if (personalWinner) {
            seenWinnerIds.current.add(String(personalWinner.id));
            setWinnerCelebration(personalWinner);
        }
    }, [serverWinners, tickets]);


    const leaderboard =
        useMemo(
            () =>
                serverWinners.map(
                    (
                        winner
                    ) => {
                        const playerName =
                            winner.userName ||
                            "Player";

                        const initials =
                            playerName
                                .split(
                                    " "
                                )
                                .map(
                                    (
                                        part
                                    ) =>
                                        part?.[0] ||
                                        ""
                                )
                                .join(
                                    ""
                                )
                                .slice(
                                    0,
                                    2
                                )
                                .toUpperCase();

                        return {
                            player:
                                playerName,

                            initials:
                                initials ||
                                "P",

                            prize:
                                winner.prizeName,

                            time:
                                winner.verifiedAt
                                    ? new Date(
                                        winner.verifiedAt
                                    ).toLocaleTimeString(
                                        "en-IN",
                                        {
                                            hour:
                                                "2-digit",
                                            minute:
                                                "2-digit",
                                        }
                                    )
                                    : "Verified",

                            accent:
                                "sunset",
                        };
                    }
                ),
            [serverWinners]
        );

    if (!tickets.length) {
        return (
            <div className="app-shell">
                <main className="page-content">
                    <section className="panel-card room-error-card">
                        <div className="room-error-icon">
                            <Ticket
                                size={22}
                            />
                        </div>

                        <h2>
                            No Tickets Found
                        </h2>

                        <p>
                            Your booking is confirmed,
                            but no registered tickets
                            were returned for this room.
                        </p>
                    </section>
                </main>
            </div>
        );
    }

    return (
        <div className="app-shell">
            {/* ADDED: Hidden audio player receives room-wide admin music. */}
            <audio ref={backgroundMusicRef} loop preload="none" aria-hidden="true" />
            {/* CHANGED: Render the winner popup above the live room when this player wins. */}
            <WinnerCelebration winner={winnerCelebration} onClose={() => setWinnerCelebration(null)} />
            {/* ADDED: Full-house result overlay stays open until the player leaves the room. */}
            <GameEndedCelebration winner={gameEndWinner} onLeave={() => navigate("/", { replace: true })} />
            <div className="ambient ambient-one" />

            <div className="ambient ambient-two" />

            <GameRoomHeader
                room={room}
                player={player}
                status={status}
                playerCount={
                    playerCount
                }
                localMusicVolume={localMusicVolume}
                localMusicMuted={localMusicMuted}
                onLocalMusicVolumeChange={(value) => {
                    setLocalMusicVolume(value);
                    if (value > 0) setLocalMusicMuted(false);
                }}
                onToggleLocalMusicMute={() => {
                    if (localMusicMuted || localMusicVolume === 0) {
                        setLocalMusicMuted(false);
                        if (localMusicVolume === 0) setLocalMusicVolume(1);
                    } else {
                        setLocalMusicMuted(true);
                    }
                }}
            />

            <main className="page-content">
                <div className="welcome-strip">
                    <div>
                        <span className="welcome-kicker">
                            <WandSparkles
                                size={14}
                            />

                            TAMBOLA PULSE
                        </span>

                        <p>
                            Welcome to{" "}
                            <strong>
                                {room?.title ||
                                    "Tambola"}
                            </strong>
                            ,{" "}
                            <strong>
                                {player?.name ||
                                    "Player"}
                            </strong>
                            .
                        </p>

                        {room?.description && (
                            <small>
                                {
                                    room.description
                                }
                            </small>
                        )}
                    </div>

                    <div className="room-date">
                        <Clock3
                            size={15}
                        />

                        {room?.startsAt
                            ? new Date(
                                room.startsAt
                            ).toLocaleString(
                                "en-IN",
                                {
                                    weekday:
                                        "short",
                                    day: "2-digit",
                                    month:
                                        "short",
                                    year:
                                        "numeric",
                                    hour:
                                        "numeric",
                                    minute:
                                        "2-digit",
                                }
                            )
                            : "Game time"}
                    </div>
                </div>

                <div className="room-layout">

                    {/* CALLER */}
                    <div className="caller-rail">
                        <NumberCaller
                            currentNumber={
                                currentNumber
                            }
                            calledNumbers={
                                calledNumbers
                            }
                            status={
                                status
                            }
                            voiceEnabled={
                                voiceEnabled
                            }
                            onToggleVoice={
                                handleToggleVoice
                            }
                            callCadence={
                                callCadence
                            }
                            lastCalledAt={
                                lastCalledAt
                            }
                        />

                        <PrizePanel
                            room={{ ...room, ...gameState }}
                            winners={serverWinners}
                        />
                    </div>

                    {/* TICKETS */}
                    <div className="ticket-rail">
                        <div className="ticket-heading-row">
                            <SectionLabel
                                eyebrow="YOUR GAME PIECES"
                                title="Your tickets"
                                action={
                                    <span className="auto-badge">
                                        <span className="live-dot" />

                                        Auto-marking on
                                    </span>
                                }
                            />
                        </div>

                        {tickets.map(
                            (
                                ticket
                            ) => (
                                <TambolaTicket
                                    key={
                                        ticket._id
                                    }
                                    ticket={
                                        ticket.grid
                                    }
                                    calledNumbers={
                                        calledNumbers
                                    }
                                    ticketNumber={
                                        ticket.publicCode ||
                                        ticket.number
                                    }
                                />
                            )
                        )}
                    </div>

                    {/* NUMBER BOARD */}
                    <div className="board-rail">
                        <NumberBoard
                            calledNumbers={
                                calledNumbers
                            }
                        />
                    </div>

                    {/* INSIGHTS */}
                    <aside className="insight-rail">
                        <Leaderboard
                            entries={
                                leaderboard
                            }
                        />

                        <ActivityFeed
                            items={
                                activity
                            }
                        />
                    </aside>
                </div>

                <footer className="page-footer">
                    <span>
                        Tambola Pulse{" "}
                        <b>·</b>{" "}
                        A friendly
                        room for friendly
                        competition
                    </span>

                    <span>
                        <ShieldCheck
                            size={13}
                        />

                        Your registered
                        tickets are used
                        for this room.
                    </span>

                    <span className="footer-help">
                        <AlertCircle
                            size={13}
                        />

                        Need help?
                    </span>
                </footer>
            </main>
        </div>
    );
}
