import { useCallback, useEffect, useRef, useState } from "react";
import { getStudentDashboard } from "../api/campusflow";

const DEFAULT_POLL_INTERVAL = 30000;

const useStudentDashboard = (pollInterval = DEFAULT_POLL_INTERVAL) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [nextRefreshIn, setNextRefreshIn] = useState(null);
  const [pollingPulse, setPollingPulse] = useState(false);
  const [newUpdates, setNewUpdates] = useState({ assignments: [], announcements: [] });
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const pulseTimeoutRef = useRef(null);
  const clearNewTimeoutRef = useRef(null);
  const nextRefreshAtRef = useRef(null);
  const previousDataRef = useRef(null);

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
        const response = await getStudentDashboard();
        setData(response);
        const syncedAt = response?.syncedAt ? new Date(response.syncedAt) : new Date();
        setLastUpdated(syncedAt);

        const previous = previousDataRef.current;
        if (previous) {
          const previousAssignments = new Set(
            (previous?.assignments?.pending || []).map((assignment) => String(assignment._id))
          );
          const previousAnnouncements = new Set(
            (previous?.announcements || []).map((announcement) => String(announcement._id))
          );
          const freshAssignments = (response?.assignments?.pending || []).filter(
            (assignment) => !previousAssignments.has(String(assignment._id))
          );
          const freshAnnouncements = (response?.announcements || []).filter(
            (announcement) => !previousAnnouncements.has(String(announcement._id))
          );

          if (freshAssignments.length || freshAnnouncements.length) {
            setNewUpdates({
              assignments: freshAssignments.map((assignment) => assignment._id),
              announcements: freshAnnouncements.map((announcement) => announcement._id),
            });
            if (clearNewTimeoutRef.current) {
              clearTimeout(clearNewTimeoutRef.current);
            }
            clearNewTimeoutRef.current = setTimeout(() => {
              setNewUpdates({ assignments: [], announcements: [] });
            }, 12000);
          }
        }
        previousDataRef.current = response;
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load student dashboard");
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
      clearTimeout(clearNewTimeoutRef.current);
    };
  }, [fetchDashboard, pollInterval]);

  const clearNewUpdates = useCallback(() => {
    setNewUpdates({ assignments: [], announcements: [] });
  }, []);

  return {
    data,
    loading,
    syncing,
    refreshing,
    pollingPulse,
    error,
    lastUpdated,
    nextRefreshIn,
    newUpdates,
    refresh: fetchDashboard,
    clearNewUpdates,
  };
};

export default useStudentDashboard;
