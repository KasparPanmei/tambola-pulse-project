import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Home from "./pages/Home.jsx";
import RoomPage from "./pages/RoomPage.jsx";
import Admin from "./pages/Admin.jsx";
import { Toaster } from "sonner";
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="*" element={<Home />} />
                <Route
                    path="/room/:code"
                    element={<RoomPage />}
                />
                <Route
                    path="/admin"
                    element={<Admin />}
                />
            </Routes>
            <Toaster
                position="top-right"
                richColors
            />
        </BrowserRouter>
    );
}
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
