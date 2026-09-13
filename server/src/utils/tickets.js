function sample(a, n) {
    a = [...a];
    for (let i = a.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, n);
}
export function generateTicket() {
    for (let attempt = 0; attempt < 5000; attempt++) {
        const rows = [
            sample([...Array(9).keys()], 5),
            sample([...Array(9).keys()], 5),
            sample([...Array(9).keys()], 5),
        ],
            counts = Array(9).fill(0);
        rows.forEach((r) => r.forEach((c) => counts[c]++));
        if (
            counts.some((c) => c < 1 || c > 3) ||
            counts.reduce((a, b) => a + b, 0) !== 15
        )
            continue;
        const g = Array.from({ length: 3 }, () => Array(9).fill(null));
        for (let c = 0; c < 9; c++) {
            const ris = rows
                .map((r, i) => (r.includes(c) ? i : -1))
                .filter((i) => i >= 0);
            const lo = c === 0 ? 1 : c * 10,
                hi = c === 8 ? 90 : c * 10 + 9;
            sample(
                Array.from({ length: hi - lo + 1 }, (_, i) => lo + i),
                ris.length,
            )
                .sort((a, b) => a - b)
                .forEach((n, i) => (g[ris[i]][c] = n));
        }
        return g;
    }
    throw Error("Could not generate ticket");
}
