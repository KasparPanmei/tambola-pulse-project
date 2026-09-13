export default function TicketGrid({ grid = [] }) {
    return (
        <div className="tgrid">
            {grid.map((row, rowIndex) => (
                <div
                    className="trow"
                    key={rowIndex}
                >
                    {row.map((number, columnIndex) => (
                        <div
                            className={`cell ${number == null
                                    ? "empty"
                                    : "filled"
                                }`}
                            key={columnIndex}
                        >
                            {number ?? "•"}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}