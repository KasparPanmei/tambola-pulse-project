import { useMemo } from "react";
import TicketCard from "./TicketCard.jsx";

export default function TicketList({
    tickets = [],
    selected = [],
    onToggle,
    onJoin,
    ticketPrice = 0,
}) {
    const selectedIds = useMemo(
        () =>
            new Set(
                selected.map(
                    (ticket) => ticket._id
                )
            ),
        [selected]
    );

    return (
        <div className="stack">

            <div className="row">
                <div>
                    <h2>
                        Buy Tickets
                    </h2>

                    <p className="small muted">
                        Select up to 6 tickets.
                    </p>
                </div>

                <span className="pill">
                    {tickets.length} Available
                </span>
            </div>

            <div className="ticket-list">
                {tickets.map((ticket) => (
                    <TicketCard
                        key={ticket._id}
                        ticket={ticket}
                        selected={selectedIds.has(
                            ticket._id
                        )}
                        onToggle={onToggle}
                    />
                ))}
            </div>

            {selected.length > 0 && (
                <div className="card pad">
                    <div className="row">

                        <div>
                            <div className="label muted">
                                Selected
                            </div>

                            <strong>
                                {selected.length}{" "}
                                {selected.length === 1
                                    ? "Ticket"
                                    : "Tickets"}
                            </strong>
                        </div>

                        <div
                            style={{
                                textAlign: "right",
                            }}
                        >
                            <div className="label muted">
                                Total
                            </div>

                            <strong
                                style={{
                                    color:
                                        "var(--amber)",
                                    fontSize: 20,
                                }}
                            >
                                ₹
                                {selected.length *
                                    ticketPrice}
                            </strong>
                        </div>

                    </div>

                    <button
                        type="button"
                        className="btn primary"
                        style={{
                            width: "100%",
                            marginTop: 12,
                        }}
                        onClick={() =>
                            onJoin(selected)
                        }
                    >
                        Continue to Checkout
                    </button>
                </div>
            )}

        </div>
    );
}