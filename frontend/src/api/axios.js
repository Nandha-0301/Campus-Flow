import axios from "axios";
import { auth } from "../firebase/config";

const PROD_API_BASE_URL = "https://campus-flow-1-n386.onrender.com/api";
const DEV_API_BASE_URL = "http://localhost:5000/api";
const PLACEHOLDER_API_HOST = "YOUR_BACKEND_DOMAIN";

const resolveApiBaseURL = () => {
  const configuredBaseURL = import.meta.env.VITE_API_BASE_URL?.trim();
  const isPlaceholderValue =
    typeof configuredBaseURL === "string" && configuredBaseURL.includes(PLACEHOLDER_API_HOST);

  if (configuredBaseURL && !isPlaceholderValue) {
    const trimmedBaseURL = configuredBaseURL.replace(/\/+$/, "");
    return trimmedBaseURL.endsWith("/api") ? trimmedBaseURL : `${trimmedBaseURL}/api`;
  }

  if (import.meta.env.PROD) {
    console.warn("VITE_API_BASE_URL is missing or using a placeholder. Falling back to the production API URL.");
    return PROD_API_BASE_URL;
  }

  return DEV_API_BASE_URL;
};

const normalizedBaseURL = resolveApiBaseURL();

export const getAuthHeaderForUser = async (firebaseUser = auth.currentUser) => {
  if (!firebaseUser) {
    throw new Error("No authenticated Firebase user available");
  }

  const token = await firebaseUser.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

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

