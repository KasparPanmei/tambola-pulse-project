import axios from "axios";

// CHANGED: Keep admin requests on the deployed origin in production instead
// of sending them to a user's localhost machine.
const BASE_URL = import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "/api";

const adminApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || BASE_URL,
});

adminApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("tp_admin_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default adminApi;
