import { randomInt } from "node:crypto";
function sample(values, count) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result.slice(0, count);
}

const COLUMN_RANGES = Array.from({ length: 9 }, (_, column) => ({
    low: column === 0 ? 1 : column * 10,
    high: column === 8 ? 90 : column * 10 + 9,
}));

/**
 * CHANGED: Generate one conventional Tambola strip: six 3x9 tickets that collectively
 * contain every number from 1 through 90 exactly once.
 */
export function generateTicketStrip() {
    // Choose how many cells each ticket receives in each column. Every ticket
    // must have 15 numbers, and each column contributes all of its numbers.
    const columnTargets = COLUMN_RANGES.map(({ low, high }) => high - low + 1);
    const columnCounts = Array.from({ length: 6 }, () => Array(9).fill(0));
    const ticketTotals = Array(6).fill(0);

    function assignColumn(column) {
        if (column === 9) return ticketTotals.every((total) => total === 15);
        const target = columnTargets[column];
        const order = sample([0, 1, 2, 3, 4, 5], 6);
        const counts = Array(6).fill(0);

        function distribute(position, remaining) {
            if (position === 6) {
                if (remaining !== 0) return false;
                for (let ticket = 0; ticket < 6; ticket++) {
                    const total = ticketTotals[ticket] + counts[ticket];
                    const columnsLeft = 8 - column;
                    if (total > 15 || total + columnsLeft > 15 || total + columnsLeft * 3 < 15) return false;
                }
                for (let ticket = 0; ticket < 6; ticket++) {
                    columnCounts[ticket][column] = counts[ticket];
                    ticketTotals[ticket] += counts[ticket];
                }
                if (assignColumn(column + 1)) return true;
                for (let ticket = 0; ticket < 6; ticket++) ticketTotals[ticket] -= counts[ticket];
                return false;
            }

            const ticket = order[position];
            const remainingTickets = 5 - position;
            const minimum = Math.max(1, remaining - remainingTickets * 3);
            const maximum = Math.min(3, remaining - remainingTickets);
            for (const count of sample(Array.from({ length: Math.max(0, maximum - minimum + 1) }, (_, i) => minimum + i), Math.max(0, maximum - minimum + 1))) {
                if (ticketTotals[ticket] + count > 15) continue;
                counts[ticket] = count;
                if (distribute(position + 1, remaining - count)) return true;
            }
            return false;
        }

        return distribute(0, target);
    }

    if (!assignColumn(0)) throw new Error("Could not build a valid six-ticket strip");

    const grids = Array.from({ length: 6 }, () => Array.from({ length: 3 }, () => Array(9).fill(null)));
    for (let ticket = 0; ticket < 6; ticket++) {
        const rowCounts = [0, 0, 0];
        function placeColumn(column) {
            if (column === 9) return rowCounts.every((count) => count === 5);
            const needed = columnCounts[ticket][column];
            const rowOptions = [0, 1, 2];
            const subsets = [];
            function choose(start, selected) {
                if (selected.length === needed) {
                    subsets.push([...selected]);
                    return;
                }
                for (let row = start; row < 3; row++) choose(row + 1, [...selected, row]);
            }
            choose(0, []);
            for (const rows of sample(subsets, subsets.length)) {
                if (rows.some((row) => rowCounts[row] >= 5)) continue;
                rows.forEach((row) => { rowCounts[row]++; grids[ticket][row][column] = true; });
                const columnsLeft = 8 - column;
                const feasible = rowCounts.every((count) => count <= 5 && count + columnsLeft >= 5);
                if (feasible && placeColumn(column + 1)) return true;
                rows.forEach((row) => { rowCounts[row]--; grids[ticket][row][column] = null; });
            }
            return false;
        }
        if (!placeColumn(0)) throw new Error("Could not arrange rows for Tambola ticket");
    }

    // CHANGED: Shuffle number-to-ticket assignment so ticket numbers are not
    // dealt out sequentially across the strip; sort only within each ticket's column.
    for (let column = 0; column < 9; column++) {
        const { low, high } = COLUMN_RANGES[column];
        const numbers = sample(
            Array.from({ length: high - low + 1 }, (_, i) => low + i),
            high - low + 1,
        );
        const slots = [];
        for (let ticket = 0; ticket < 6; ticket++) {
            for (let row = 0; row < 3; row++) {
                if (grids[ticket][row][column] === true) slots.push({ ticket, row });
            }
        }
        const shuffledSlots = sample(slots, slots.length);
        const ticketValues = Array.from({ length: 6 }, () => []);
        shuffledSlots.forEach(({ ticket }, index) => ticketValues[ticket].push(numbers[index]));

        for (let ticket = 0; ticket < 6; ticket++) {
            const occupiedRows = [0, 1, 2].filter((row) => grids[ticket][row][column] === true);
            ticketValues[ticket].sort((a, b) => a - b).forEach((number, index) => {
                grids[ticket][occupiedRows[index]][column] = number;
            });
        }
    }

    return grids;
}

// Retained for any legacy caller, but admin inventory should use complete strips.
export function generateTicket() {
    return generateTicketStrip()[0];
}
