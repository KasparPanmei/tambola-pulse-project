import axios from "axios";

const BASE_URL = import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://tambola-pulse-project-production.up.railway.app/api";

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

// An expired or revoked admin session must clear local credentials, not just hide the dashboard.
adminApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("tp_admin_token");
            localStorage.removeItem("tp_admin_user");
            if (window.location.pathname === "/admin") {
                window.location.replace("/");
            }
        }

        return Promise.reject(error);
    },
);

export default adminApi;
