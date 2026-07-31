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

export const getAuthHeaderForUser = async (firebaseUser = auth.currentUser, forceRefresh = false) => {
  if (!firebaseUser) {
    throw new Error("No authenticated Firebase user available");
  }

  const token = await firebaseUser.getIdToken(forceRefresh);
  if (!token) {
    throw new Error("Firebase ID token was empty");
  }

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
      const existingAuthorization = config.headers?.Authorization || config.headers?.authorization;
      if (existingAuthorization) {
        return config;
      }

      if (auth.currentUser) {
        const forceRefresh = Boolean(config.forceRefreshToken);
        const token = await auth.currentUser.getIdToken(forceRefresh);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
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
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthMe = url.includes("/auth/me");

    if (!(isAuthMe && status === 404)) {
      console.error("API ERROR:", error.response?.data || error);
    }

    const originalConfig = error.config;
    if (
      status === 401 &&
      originalConfig &&
      !originalConfig._retriedWithFreshToken &&
      auth.currentUser &&
      !originalConfig.skipAuthRetry
    ) {
      originalConfig._retriedWithFreshToken = true;
      try {
        const freshToken = await auth.currentUser.getIdToken(true);
        originalConfig.headers = {
          ...(originalConfig.headers || {}),
          Authorization: `Bearer ${freshToken}`,
        };
        console.info("API retry: refreshed Firebase ID token after 401", { url });
        return api.request(originalConfig);
      } catch (refreshError) {
        console.warn("API retry: failed to refresh Firebase ID token", refreshError?.message || refreshError);
      }
    }

    if (status === 401) {
      console.warn("Unauthorized request. Token may be expired or rejected by backend.", {
        url,
        message: error.response?.data?.message || null,
        errors: error.response?.data?.errors || null,
      });
    }
    return Promise.reject(error);
  }
);

export default api;
