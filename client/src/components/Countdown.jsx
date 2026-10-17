import { useEffect, useState } from "react";
export default function Countdown({ target, format = "minutes" }) {
    const left = () =>
        Math.max(0, Math.floor((new Date(target) - Date.now()) / 1000));
    const [s, setS] = useState(left);
    useEffect(() => {
        const id = setInterval(() => setS(left()), 1000);
        return () => clearInterval(id);
    }, [target]);
    if (format === "days-hours-minutes-seconds") {
        const days = Math.floor(s / 86400);
        const hours = Math.floor((s % 86400) / 3600);
        const minutes = Math.floor((s % 3600) / 60);
        const seconds = s % 60;
        return <>{days}d {String(hours).padStart(2, "0")}h {String(minutes).padStart(2, "0")}m {String(seconds).padStart(2, "0")}s</>;
    }

    return <>{Math.floor(s / 60)}m {String(s % 60).padStart(2, "0")}s</>;
}
