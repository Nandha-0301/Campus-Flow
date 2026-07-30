import axios from "axios";
import { auth } from "../firebase/config";

const rawBaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const trimmedBaseURL = rawBaseURL.replace(/\/+$/, "");
const normalizedBaseURL = trimmedBaseURL.endsWith("/api") ? trimmedBaseURL : `${trimmedBaseURL}/api`;

const api = axios.create({
  baseURL: normalizedBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error attaching Firebase token", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthMe = url.includes("/auth/me");

    if (!(isAuthMe && status === 404)) {
      console.error("API ERROR:", error.response?.data || error);
    }

    if (status === 401) {
      console.warn("Unauthorized request. Token may be expired.");
    }
    return Promise.reject(error);
  }
);

export default api;

