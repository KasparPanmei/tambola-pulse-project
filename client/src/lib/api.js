import axios from "axios";

// CHANGED: Use the local backend only in development; production uses the
// same-origin /api path served by the Express deployment.
const BASE_URL = import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "/api";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || BASE_URL,
});
api.interceptors.request.use((c) => {
    const t = localStorage.getItem("tp_token");
    if (t) c.headers.Authorization = `Bearer ${t}`;
    return c;
});
export default api;
