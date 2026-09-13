import { useEffect, useState } from "react";
export default function Countdown({ target }) {
    const left = () =>
        Math.max(0, Math.floor((new Date(target) - Date.now()) / 1000));
    const [s, setS] = useState(left);
    useEffect(() => {
        const id = setInterval(() => setS(left()), 1000);
        return () => clearInterval(id);
    }, [target]);
    return (
        <>
            {Math.floor(s / 60)}m {String(s % 60).padStart(2, "0")}s
        </>
    );
}
