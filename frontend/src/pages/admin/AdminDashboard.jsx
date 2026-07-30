import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, CheckCircle2, FileWarning, ShieldCheck, TrendingUp, Wrench } from "lucide-react";
import Card, { CardBody, CardHeader } from "../../components/Card";
import Error from "../../components/Error";
import Skeleton from "../../components/Skeleton";
import { getAdminDashboard } from "../../api/admin";

const SystemHealthTrendChart = lazy(() => import("../../components/charts/SystemHealthTrendChart"));

const FILTERS = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "warning", label: "Warning" },
  { key: "info", label: "Info" },
];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminDashboard();
      setDashboard(response);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isLoading = loading && !dashboard;
  const statsSource = dashboard?.stats;
  const statsSummary =
    dashboard?.statsSummary ||
    (Array.isArray(statsSource)
      ? {
          totalStaff: statsSource.find((item) => item.key === "totalStaff")?.value ?? 0,
          totalSubjects: statsSource.find((item) => item.key === "totalSubjects")?.value ?? 0,
          totalClasses: statsSource.find((item) => item.key === "totalClasses")?.value ?? 0,
        }
      : statsSource) ||
    {};

  const activityFeed = dashboard?.activityFeed || dashboard?.recentActivity || [];
  const systemHealth = dashboard?.systemHealth || {};
  const healthSummary = systemHealth.summary || {};
  const healthClasses = systemHealth.classes || dashboard?.health || [];
  const healthTrend = systemHealth.healthTrend || [];
  const mostProblematic = systemHealth.mostProblematic || null;
  const consistencyWarning = systemHealth.consistencyWarning;

  const totalClasses = healthSummary.totalClasses ?? statsSummary.totalClasses ?? 0;
  const misconfiguredCount = healthSummary.misconfiguredCount ?? 0;
  const warningCount = healthSummary.warningCount ?? 0;
  const healthyCount = healthSummary.healthyCount ?? 0;
  const healthyPercent = totalClasses ? Math.round((healthyCount / totalClasses) * 100) : 0;
  const misconfiguredPercent = totalClasses ? Math.round((misconfiguredCount / totalClasses) * 100) : 0;

  const topIssues = useMemo(() => {
    return {
      missingTeaching: healthClasses.filter((item) => item.health && !item.health.hasTeachingAssignments).length,
      missingMarks: healthClasses.filter((item) => item.health && !item.health.hasMarks).length,
      missingTimetable: healthClasses.filter((item) => item.health && !item.health.hasTimetable).length,
    };
  }, [healthClasses]);

  const filteredClasses = useMemo(() => {
    if (filter === "all") return healthClasses;
    return healthClasses.filter((item) => item.status === filter);
  }, [filter, healthClasses]);

  if (error && !loading) return <Error message={error} onRetry={fetchData} />;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-500">Configuration hub for staff, classes, and subjects.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/staff"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md active:scale-[0.98]"
          >
            + Create Staff
          </Link>
          <Link
            to="/admin/academics"
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-100 active:scale-[0.98]"
          >
            + Create Subject
          </Link>
          <Link
            to="/admin/classes"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 active:scale-[0.98]"
          >
            + Create Class
          </Link>
          <Link
            to="/admin/academics"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 active:scale-[0.98]"
          >
            + Assign Teaching
          </Link>
        </div>
      </div>

      {!isLoading && misconfiguredCount > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {misconfiguredCount} class{misconfiguredCount === 1 ? "" : "es"} need configuration.
        </div>
      )}

      {!isLoading && consistencyWarning && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          Some data may be incomplete. Attendance or marks entries are missing for enrolled students.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Stat title="Total Staff" value={statsSummary.totalStaff ?? 0} loading={isLoading} />
        <Stat title="Total Subjects" value={statsSummary.totalSubjects ?? 0} loading={isLoading} />
        <Stat title="Total Classes" value={statsSummary.totalClasses ?? 0} loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-gray-50 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              <h2 className="text-lg font-bold text-gray-900">System Health Trend</h2>
            </div>
            <span className="text-xs text-gray-400">Last 7 days</span>
          </CardHeader>
          <CardBody className="h-64">
            {isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : healthTrend.length ? (
              <Suspense fallback={<Skeleton className="h-[220px] w-full" />}>
                <div className="w-full h-[220px]">
                  <SystemHealthTrendChart data={healthTrend} />
                </div>
              </Suspense>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <ShieldCheck size={18} />
                <div>
                  <p className="font-semibold">No trend data yet.</p>
                  <p className="text-xs text-slate-500">Snapshots will appear after daily system checks.</p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="border-b border-gray-50 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              <h2 className="text-lg font-bold text-gray-900">Most Problematic Class</h2>
            </div>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : mostProblematic && mostProblematic.issueCount > 0 ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-900">{mostProblematic.className}</p>
                <p className="text-xs text-red-600">{mostProblematic.issueCount} missing data point{mostProblematic.issueCount === 1 ? "" : "s"}</p>
                <Link
                  to="/admin/academics"
                  className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                >
                  Resolve now
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                <ShieldCheck size={18} />
                <div>
                  <p className="font-semibold">All classes look healthy.</p>
                  <p className="text-xs text-emerald-700/80">No critical gaps detected right now.</p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader className="border-b border-gray-50 pb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">System Health</h2>
            <p className="text-xs text-gray-500">
              Fixes here auto-sync to student dashboards in minutes. Keep the system healthy.
            </p>
          </div>
          <Link
            to="/admin/academics"
            className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
          >
            Fix Now
          </Link>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <HealthStat
              title="Total Classes"
              value={healthSummary.totalClasses ?? statsSummary.totalClasses ?? 0}
              tone="slate"
              loading={isLoading}
            />
            <HealthStat title="Misconfigured" value={misconfiguredCount} tone="red" loading={isLoading} />
            <HealthStat title="Warnings" value={warningCount} tone="orange" loading={isLoading} />
            <HealthStat title="% Healthy" value={`${healthyPercent}%`} tone="emerald" loading={isLoading} />
            <HealthStat title="% Misconfigured" value={`${misconfiguredPercent}%`} tone="red" loading={isLoading} />
          </div>

          <div className="mb-5">
            {isLoading ? (
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-12 w-56" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <TopIssueChip
                  icon={Wrench}
                  tone="red"
                  label="Classes missing TeachingAssignments"
                  value={topIssues.missingTeaching}
                />
                <TopIssueChip
                  icon={FileWarning}
                  tone="orange"
                  label="Classes missing marks"
                  value={topIssues.missingMarks}
                />
                <TopIssueChip
                  icon={CalendarClock}
                  tone="amber"
                  label="Classes missing timetable"
                  value={topIssues.missingTimetable}
                />
              </div>
            )}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
                  filter === item.key
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="py-2 pr-4">Class</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Issues</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading &&
                  Array.from({ length: 4 }).map((_, index) => (
                    <tr key={`skeleton-${index}`}>
                      <td className="py-3 pr-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="py-3 pr-4">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </td>
                      <td className="py-3 pr-4">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="py-3">
                        <Skeleton className="h-7 w-20 rounded-full" />
                      </td>
                    </tr>
                  ))}

                {!isLoading && filteredClasses.length === 0 && (
                  <tr>
                    <td className="py-6" colSpan={4}>
                      <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                        <ShieldCheck size={20} />
                        <div>
                          <p className="font-semibold">No classes in this filter.</p>
                          <p className="text-xs text-emerald-700/80">
                            Everything looks healthy right now. Try another filter to review details.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  filteredClasses.map((item) => {
                    const issues = item.issues || [];
                    return (
                      <tr key={item.classId || item.className}>
                        <td className="py-3 pr-4 font-semibold text-gray-900">{item.className}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                              item.status === "critical"
                                ? "border-red-200 bg-red-100 text-red-700"
                                : item.status === "warning"
                                  ? "border-orange-200 bg-orange-100 text-orange-700"
                                  : item.status === "info"
                                    ? "border-yellow-200 bg-yellow-100 text-yellow-700"
                                    : "border-emerald-200 bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-xs text-gray-600">
                          {issues.length ? issues.join(", ") : "Healthy"}
                        </td>
                        <td className="py-3">
                          <Link
                            to="/admin/academics"
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            Fix Now
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="border-b border-gray-50 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Global Activity Feed</h2>
            <p className="text-xs text-gray-500">Live system actions across CampusFlow.</p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {isLoading &&
              Array.from({ length: 4 }).map((_, index) => (
                <div key={`activity-skeleton-${index}`} className="rounded-lg border border-gray-100 px-3 py-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-2 h-3 w-24" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </div>
              ))}

            {!isLoading && activityFeed.length === 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <CheckCircle2 size={18} />
                <div>
                  <p className="font-semibold">No activity yet.</p>
                  <p className="text-xs text-slate-500">System actions will appear once staff start working.</p>
                </div>
              </div>
            )}

            {!isLoading &&
              activityFeed.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 px-3 py-2 transition hover:-translate-y-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{item.action}</p>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">{item.role}</span>
                  </div>
                  <p className="text-xs text-gray-500">{item.performedBy}</p>
                  <p className="text-[10px] text-gray-400">{item.time ? new Date(item.time).toLocaleString() : "Just now"}</p>
                </div>
              ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

const HealthStat = ({ title, value, tone = "slate", loading = false }) => {
  const palette = {
    slate: "bg-slate-50 text-slate-700",
    red: "bg-red-50 text-red-700",
    orange: "bg-orange-50 text-orange-700",
    yellow: "bg-yellow-50 text-yellow-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };

  return (
    <Card>
      <CardBody className="p-5">
        <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">{title}</p>
        {loading ? <Skeleton className="mt-3 h-7 w-20" /> : <p className={`mt-2 text-3xl font-black ${palette[tone]}`}>{value}</p>}
      </CardBody>
    </Card>
  );
};

const Stat = ({ title, value, loading = false }) => (
  <Card>
    <CardBody className="p-5">
      <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">{title}</p>
      {loading ? <Skeleton className="mt-3 h-7 w-24" /> : <p className="mt-2 text-3xl font-black text-gray-900">{value}</p>}
    </CardBody>
  </Card>
);

const TopIssueChip = ({ icon, label, value, tone = "red" }) => {
  const Icon = icon;
  const palette = {
    red: "border-red-200 bg-red-50 text-red-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${palette[tone]}`}>
      <Icon size={18} />
      <div>
        <p className="text-xs uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-lg font-black">{value}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;







