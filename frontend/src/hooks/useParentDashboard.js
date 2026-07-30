import { useCallback, useEffect, useRef, useState } from "react";
import { getParentDashboard } from "../api/campusflow";

const DEFAULT_POLL_INTERVAL = 30000;

const useParentDashboard = (pollInterval = DEFAULT_POLL_INTERVAL) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [nextRefreshIn, setNextRefreshIn] = useState(null);
  const [pollingPulse, setPollingPulse] = useState(false);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const pulseTimeoutRef = useRef(null);
  const nextRefreshAtRef = useRef(null);

  const fetchDashboard = useCallback(
    async ({ source = "poll" } = {}) => {
      try {
        if (source === "manual") {
          setRefreshing(true);
        }
        if (source === "initial") {
          setLoading(true);
        } else {
          setSyncing(true);
          setPollingPulse(true);
        }
        setError("");
        const response = await getParentDashboard();
        setData(response);
        const syncedAt = response?.syncedAt ? new Date(response.syncedAt) : new Date();
        setLastUpdated(syncedAt);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load parent dashboard");
      } finally {
        setLoading(false);
        setSyncing(false);
        setRefreshing(false);
        if (source === "poll") {
          if (pulseTimeoutRef.current) {
            clearTimeout(pulseTimeoutRef.current);
          }
          pulseTimeoutRef.current = setTimeout(() => {
            setPollingPulse(false);
          }, 800);
        } else {
          setPollingPulse(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchDashboard({ source: "initial" });
    nextRefreshAtRef.current = Date.now() + pollInterval;
    intervalRef.current = setInterval(() => {
      fetchDashboard({ source: "poll" });
      nextRefreshAtRef.current = Date.now() + pollInterval;
    }, pollInterval);
    countdownRef.current = setInterval(() => {
      if (!nextRefreshAtRef.current) return;
      const diff = Math.max(0, Math.ceil((nextRefreshAtRef.current - Date.now()) / 1000));
      setNextRefreshIn(diff);
    }, 1000);
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
      clearTimeout(pulseTimeoutRef.current);
    };
  }, [fetchDashboard, pollInterval]);

  return {
    data,
    loading,
    syncing,
    refreshing,
    pollingPulse,
    error,
    lastUpdated,
    nextRefreshIn,
    refresh: fetchDashboard,
  };
};

export default useParentDashboard;
