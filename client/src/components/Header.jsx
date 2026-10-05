import { Bell, Wallet } from "lucide-react";
import ThemeSelector from "./ThemeSelector.jsx";

export default function Header() {
    return (
        <header className="header">
            <div className="brand">
                <div className="logo">TP</div>
                <div>
                    <div className="brand-title">Tambola Pulse</div>
                    <div className="label brand-sub">Home</div>
                </div>
            </div>
            <div className="h-actions">
                {/* CHANGED: Keep the original theme as the default and let players switch to three saved alternatives. */}
                <ThemeSelector />
                <div className="wallet"><Wallet size={16} />₹1,450</div>
                <button className="icon-btn" aria-label="Notifications"><Bell size={21} /></button>
            </div>
        </header>
    );
}
