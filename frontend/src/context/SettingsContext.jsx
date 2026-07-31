import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getPublicSettings } from "../api/campusflow";

const SettingsContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getPublicSettings();
      setSettings(response?.settings || response || null);

      const backendProjectId = response?.firebaseProjectId;
      const frontendProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      if (backendProjectId && frontendProjectId && backendProjectId !== frontendProjectId) {
        console.error("Firebase project mismatch: frontend and backend use different Firebase projects", {
          frontendProjectId,
          backendProjectId,
        });
      } else if (backendProjectId && frontendProjectId) {
        console.info("Firebase project alignment check passed", { projectId: frontendProjectId });
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const value = {
    settings,
    loading,
    error,
    refresh: loadSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
