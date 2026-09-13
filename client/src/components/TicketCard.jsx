import { Check, Plus } from "lucide-react";
import TicketGrid from "./TicketGrid.jsx";

export default function TicketCard({
    ticket,
    selected,
    onToggle,
}) {
    const isAvailable = ticket.status === "available";

    const handleClick = () => {
        if (!isAvailable) return;
        onToggle(ticket);
    };

    const handleKeyDown = (event) => {
        if (!isAvailable) return;

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle(ticket);
        }
    };

    return (
        <div
            className={`ticket ${selected
                ? "selected"
                : isAvailable
                    ? "available"
                    : "unavailable"
                }`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role={isAvailable ? "button" : undefined}
            tabIndex={isAvailable ? 0 : -1}
            aria-pressed={selected}
            aria-disabled={!isAvailable}
        >
            {/* Ticket Header */}
            <div className="ticket-head">
                <div className="ticket-id">
                    <span className="mark">
                        {selected ? (
                            <Check size={15} />
                        ) : (
                            <Plus size={14} />
                        )}
                    </span>

                    <strong>
                        Ticket #{ticket.number}
                    </strong>

                    <span className="code">
                        {ticket.publicCode}
                    </span>
                </div>

                {selected ? (
                    <span className="pill amber">
                        Booked in Cart
                    </span>
                ) : isAvailable ? (
                    <button
                        type="button"
                        className="btn surface"
                        style={{
                            minHeight: 32,
                            padding: "0 10px",
                            fontSize: 12,
                        }}
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggle(ticket);
                        }}
                    >
                        + Add Ticket
                    </button>
                ) : (
                    <span className="pill">
                        {ticket.status === "held"
                            ? "Temporarily Held"
                            : "Booked"}
                    </span>
                )}
            </div>

            {/* Ticket Grid */}
            <TicketGrid grid={ticket.grid} />
        </div>
    );
}