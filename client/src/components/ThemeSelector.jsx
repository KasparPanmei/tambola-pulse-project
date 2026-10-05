import { useEffect, useState } from "react";
import { Palette } from "lucide-react";

// CHANGED: Preserve the original palette and offer three dark plus two light alternatives.
const themes = [
    { id: "midnight", label: "Original" },
    { id: "lagoon", label: "Lagoon" },
    { id: "forest", label: "Forest" },
    { id: "rose", label: "Rose" },
    // CHANGED: Add a warm ivory light theme and a cool blue-tinted light theme.
    { id: "light-soft", label: "Soft Light" },
    { id: "light-cool", label: "Cool Light" },
];

export default function ThemeSelector() {
    const [theme, setTheme] = useState(() => {
        try {
            const saved = localStorage.getItem("tp_theme");
            return themes.some((item) => item.id === saved) ? saved : "midnight";
        } catch {
            return "midnight";
        }
    });

    useEffect(() => {
        // CHANGED: Apply the selected theme globally and persist it across homepage and game-room navigation.
        document.documentElement.dataset.theme = theme;
        try {
            localStorage.setItem("tp_theme", theme);
        } catch {
            // The theme still applies for this page when storage is unavailable.
        }
    }, [theme]);

    return (
        <label className="theme-picker" title="Change color theme">
            <Palette size={15} aria-hidden="true" />
            <span className="theme-picker-label">Theme</span>
            <select
                aria-label="Choose color theme"
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
            >
                {themes.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                ))}
            </select>
        </label>
    );
}
