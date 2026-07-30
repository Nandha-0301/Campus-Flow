import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import Card, { CardBody, CardHeader } from "../../components/Card";
import Error from "../../components/Error";
import Loader from "../../components/Loader";
import { getStaffTimetable } from "../../api/campusflow";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const toMinutes = (value = "") => {
  const [hours, minutes] = String(value).split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return -1;
  return hours * 60 + minutes;
};

const formatTimeLabel = (startTime, endTime, fallback) => {
  if (fallback) return fallback;
  if (!startTime || !endTime) return "Time not set";
  return `${startTime} - ${endTime}`;
};

const getCurrentDayName = (date) => {
  const dayIndex = date.getDay();
  if (dayIndex === 0) return "Sunday";
  return DAY_ORDER[dayIndex - 1];
};

const isCurrentEntry = (entry, now) => {
  const currentDay = getCurrentDayName(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return entry.day === currentDay && currentMinutes >= toMinutes(entry.startTime) && currentMinutes < toMinutes(entry.endTime);
};

const buildTimetableGrid = (entries) => {
  const slotMap = new Map();

  entries.forEach((entry) => {
    const slotKey = `${entry.startTime || ""}-${entry.endTime || ""}`;
    if (!slotMap.has(slotKey)) {
      slotMap.set(slotKey, {
        key: slotKey,
        startTime: entry.startTime,
        endTime: entry.endTime,
        label: formatTimeLabel(entry.startTime, entry.endTime, entry.time),
        days: DAY_ORDER.reduce((acc, day) => ({ ...acc, [day]: [] }), {}),
      });
    }

    slotMap.get(slotKey).days[entry.day] = [...slotMap.get(slotKey).days[entry.day], entry];
  });

  return Array.from(slotMap.values()).sort((a, b) => {
    const startDifference = toMinutes(a.startTime) - toMinutes(b.startTime);
    if (startDifference !== 0) return startDifference;
    return toMinutes(a.endTime) - toMinutes(b.endTime);
  });
};

const Timetable = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const loadTimetable = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getStaffTimetable();
        const timetable = Array.isArray(response?.timetable) ? response.timetable : [];
        const sorted = [...timetable].sort((a, b) => {
          const dayDifference = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
          if (dayDifference !== 0) return dayDifference;
          const startDifference = toMinutes(a.startTime) - toMinutes(b.startTime);
          if (startDifference !== 0) return startDifference;
          return toMinutes(a.endTime) - toMinutes(b.endTime);
        });
        setEntries(sorted);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load timetable");
      } finally {
        setLoading(false);
      }
    };

    loadTimetable();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeEntry = useMemo(() => entries.find((entry) => isCurrentEntry(entry, now)) || null, [entries, now]);
  const gridRows = useMemo(() => buildTimetableGrid(entries), [entries]);
  const visibleDays = useMemo(() => {
    const weekdays = DAY_ORDER.slice(0, 5);
    const weekendDays = DAY_ORDER.slice(5).filter((day) => entries.some((entry) => entry.day === day));
    return [...weekdays, ...weekendDays];
  }, [entries]);
  const todayName = useMemo(() => getCurrentDayName(now), [now]);

  if (loading) return <Loader className="min-h-[60vh]" />;
  if (error) return <Error message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Timetable</h1>
          <p className="mt-2 text-sm text-gray-500">Your weekly teaching schedule</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">Today</p>
            <p className="mt-1 text-sm font-semibold text-sky-950">{todayName}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Weekly Slots</p>
            <p className="mt-1 text-sm font-semibold text-emerald-950">{entries.length}</p>
          </div>
        </div>
      </div>

      {activeEntry && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 shadow-lg shadow-amber-100/60">
          <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-amber-700">Current Class</p>
              <h2 className="mt-2 text-xl font-bold text-gray-900">
                {activeEntry.subject?.name || "Assigned Subject"}
                {activeEntry.subject?.code ? ` (${activeEntry.subject.code})` : ""}
              </h2>
              <p className="mt-1 text-sm text-gray-600">{activeEntry.class?.name || "Assigned Class"}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 ring-1 ring-amber-200">
                <CalendarDays size={16} className="text-amber-600" />
                {activeEntry.day}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 ring-1 ring-amber-200">
                <Clock3 size={16} className="text-amber-600" />
                {activeEntry.time}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 ring-1 ring-amber-200">
                <MapPin size={16} className="text-amber-600" />
                {activeEntry.room || "Room not assigned"}
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      {!entries.length ? (
        <Card>
          <CardBody className="py-12 text-center">
            <p className="text-lg font-semibold text-gray-900">No timetable assigned</p>
            <p className="mt-2 text-sm text-gray-500">Your weekly schedule will appear here once admin assigns your class slots.</p>
          </CardBody>
        </Card>
      ) : (
        <Card className="overflow-hidden border-gray-200 shadow-xl shadow-gray-200/40">
          <CardHeader className="border-b border-gray-100 bg-gray-50/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Weekly Grid</h2>
                <p className="mt-1 text-sm text-gray-500">Read-only view of the timetable assigned to your teaching responsibilities.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-500 ring-1 ring-gray-200">
                Auto-sorted by day and time
              </span>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 border-b border-r border-gray-200 bg-gray-50 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.22em] text-gray-500">
                    Time
                  </th>
                  {visibleDays.map((day) => (
                    <th
                      key={day}
                      className={`border-b border-gray-200 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.22em] ${
                        day === todayName ? "bg-sky-50 text-sky-700" : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridRows.map((row) => (
                  <tr key={row.key} className="align-top">
                    <td className="sticky left-0 z-[1] border-r border-b border-gray-200 bg-white px-4 py-4">
                      <p className="text-sm font-semibold text-gray-900">{row.label}</p>
                    </td>
                    {visibleDays.map((day) => {
                      const dayEntries = row.days[day] || [];
                      return (
                        <td key={`${row.key}-${day}`} className="border-b border-r border-gray-200 bg-white px-3 py-3">
                          {dayEntries.length ? (
                            <div className="space-y-2">
                              {dayEntries.map((entry) => {
                                const active = isCurrentEntry(entry, now);
                                return (
                                  <div
                                    key={entry._id}
                                    className={`rounded-2xl border px-3 py-3 shadow-sm transition-all duration-300 ${
                                      active
                                        ? "border-amber-300 bg-amber-50 shadow-amber-100"
                                        : "border-gray-200 bg-gray-50/80"
                                    }`}
                                  >
                                    <p className="text-sm font-bold text-gray-900">{entry.subject?.name || "Subject"}</p>
                                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                                      {entry.subject?.code || "Code pending"}
                                    </p>
                                    <p className="mt-3 text-sm text-gray-700">{entry.class?.name || "Assigned Class"}</p>
                                    <p className="mt-2 text-xs text-gray-500">{entry.room || "Room not assigned"}</p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="min-h-[112px] rounded-2xl border border-dashed border-gray-200 bg-gray-50/50" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Timetable;
