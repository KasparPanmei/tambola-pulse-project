import axios from "axios";

const BASE_URL = import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://tambola-pulse-project-production.up.railway.app/api";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("tp_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;
