import React, { Suspense, lazy, useMemo } from "react";
import Layout from "../../components/Layout";
import Card, { CardBody, CardHeader } from "../../components/Card";
import Skeleton from "../../components/Skeleton";
import { useAuth } from "../../context/AuthContext";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle,
  ClipboardList,
  ListChecks,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import useParentDashboard from "../../hooks/useParentDashboard";

const AttendanceTrendChart = lazy(() => import("../../components/charts/AttendanceTrendChart"));
const MarksTrendChart = lazy(() => import("../../components/charts/MarksTrendChart"));

const ParentDashboard = () => {
  const { user } = useAuth();
  const {
    data,
    loading,
    syncing,
    refreshing,
    pollingPulse,
    error,
    lastUpdated,
    refresh,
  } = useParentDashboard();

  const isLoading = loading && !data;
  const primaryChild = data?.children?.[0];

  const alerts = primaryChild?.alerts || [];
  const subjects = primaryChild?.subjects || [];
  const attendance = primaryChild?.attendance || {};
  const marksOverview = primaryChild?.marksOverview || [];
  const hasMarks = marksOverview.some((item) => item.averageMarks !== null);
  const attendanceTrend = primaryChild?.attendanceTrend || [];
  const marksTrend = primaryChild?.marksTrend || [];
  const sectionUpdatedAt = primaryChild?.lastUpdated || {};
  const classNotConfigured = primaryChild?.systemState?.hasTeachingAssignments === false;
  const consistencyWarning = primaryChild?.consistencyWarning;
  const improvementSuggestion = primaryChild?.improvementSuggestion;
  const notifications = primaryChild?.notifications || {};

  const averageMarks = primaryChild?.stats?.averageMarks ?? null;
  const averageMarksDisplay = averageMarks === null ? "N/A" : averageMarks;
  const subjectsCount = primaryChild?.stats?.subjectsCount ?? 0;
  const alertsCount = primaryChild?.stats?.alertsCount ?? alerts.length;

  const newMarksCount = notifications.newMarksCount ?? 0;
  const newAssignmentsCount = notifications.newAssignmentsCount ?? 0;
  const newMarksSubjects = notifications.newMarksSubjects || [];
  const newAssignments = notifications.newAssignments || [];
  const totalNotifications = newMarksCount + newAssignmentsCount;

  const statusLabel = useMemo(() => {
    if (syncing || loading || refreshing) return "Syncing...";
    if (!lastUpdated) return "Updated just now";
    const diffSeconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (diffSeconds < 5) return "Updated just now";
    if (diffSeconds < 60) return `Last updated ${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `Last updated ${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Last updated ${diffHours} hr ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Last updated ${diffDays}d ago`;
  }, [syncing, loading, refreshing, lastUpdated]);

  const criticalAlerts = useMemo(() => alerts.filter((alert) => alert.level === "critical"), [alerts]);
  const warningAlerts = useMemo(() => alerts.filter((alert) => alert.level === "warning"), [alerts]);

  const riskIndicator = useMemo(
    () => getRiskIndicator(criticalAlerts.length, warningAlerts.length),
    [criticalAlerts.length, warningAlerts.length]
  );

  const performanceSummary = useMemo(
    () => buildPerformanceSummary({ subjects, attendancePercentage: attendance.percentage }),
    [subjects, averageMarks, attendance.percentage]
  );

  const actionGuidance = useMemo(
    () => buildActionGuidance({ alerts, improvementSuggestion, attendancePercentage: attendance.percentage }),
    [alerts, improvementSuggestion, attendance.percentage]
  );

  const attendanceInsight = useMemo(() => getAttendanceInsight(attendanceTrend), [attendanceTrend]);
  const marksInsight = useMemo(() => getMarksInsight(marksTrend), [marksTrend]);

  const formatUpdatedAt = (value) => {
    if (!value) return "awaiting updates";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "awaiting updates";
    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 60) return "just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return "today";
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "yesterday";
    return `${diffDays} days ago`;
  };

  return (
    <Layout>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Parent Portal</h1>
          <p className="mt-2 text-sm text-gray-500">
            Welcome, {user?.name || user?.email}. Monitor your child with trusted, live insights.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <BadgeCheck size={14} />
            Data verified from school system
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <span
              className={`h-2 w-2 rounded-full ${
                pollingPulse ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
              }`}
            />
            <span>{statusLabel}</span>
          </div>
          <div className="relative inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
            <Bell size={14} />
            <span>Notifications</span>
            <span
              className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                totalNotifications ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {totalNotifications}
            </span>
          </div>
          <button
            type="button"
            onClick={() => refresh({ source: "manual" })}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error} We will retry automatically.
          <button
            type="button"
            onClick={() => refresh({ source: "manual" })}
            className="ml-3 inline-flex items-center rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
          >
            Retry now
          </button>
        </div>
      )}

      {classNotConfigured && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          Class not fully configured. Please contact the school admin.
        </div>
      )}

      {!isLoading && consistencyWarning && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          Some data is not yet available. We'll update this dashboard as soon as it syncs.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Attendance"
          value={`${attendance.percentage ?? 0}%`}
          subtitle="Overall attendance"
          icon={Calendar}
          loading={isLoading}
        />
        <StatCard
          title="Average Marks"
          value={averageMarksDisplay}
          subtitle="Across all subjects"
          icon={BarChart3}
          loading={isLoading}
        />
        <StatCard
          title="Subjects"
          value={subjectsCount}
          subtitle="Teaching assignments"
          icon={BookOpen}
          loading={isLoading}
        />
        <StatCard
          title="Alerts"
          value={alertsCount}
          subtitle="Issues needing attention"
          icon={AlertTriangle}
          loading={isLoading}
        />
      </div>

      <Card className="mb-8">
        <CardBody className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Latest updates</p>
            <p className="text-xs text-gray-500">New marks or assignments from the last 7 days.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              New marks: {newMarksCount}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              New assignments: {newAssignmentsCount}
            </span>
          </div>
        </CardBody>
        {!isLoading && totalNotifications > 0 && (
          <CardBody className="border-t border-slate-200 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">New marks</p>
                {newMarksSubjects.length ? (
                  <div className="mt-2 space-y-2">
                    {newMarksSubjects.map((subject) => (
                      <div key={subject.subjectId} className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">{subject.code || subject.name}</span>
                        <span className="text-xs text-slate-400">Updated {formatUpdatedAt(subject.updatedAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">No new marks updates.</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">New assignments</p>
                {newAssignments.length ? (
                  <div className="mt-2 space-y-2">
                    {newAssignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">
                          {assignment.title}{" "}
                          <span className="text-xs text-slate-400">
                            ({assignment.subject?.code || assignment.subject?.name || "Subject"})
                          </span>
                        </span>
                        <span className="text-xs text-slate-400">New</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">No new assignments.</p>
                )}
              </div>
            </div>
          </CardBody>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-gray-50 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-indigo-500" />
              <h2 className="text-lg font-bold text-gray-900">Priority Alerts</h2>
            </div>
            <span className="text-xs text-gray-400">{alerts.length} active</span>
          </CardHeader>
          <CardBody className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : alerts.length ? (
              <>
                {criticalAlerts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Critical</p>
                    <div className="mt-2 space-y-2">
                      {criticalAlerts.map((alert, index) => (
                        <AlertCard key={`${alert.type}-${index}`} alert={alert} />
                      ))}
                    </div>
                  </div>
                )}
                {warningAlerts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Medium Priority</p>
                    <div className="mt-2 space-y-2">
                      {warningAlerts.map((alert, index) => (
                        <AlertCard key={`${alert.type}-${index}`} alert={alert} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={CheckCircle}
                title="All performance indicators are normal"
                description="We'll alert you if any risk or missing data appears."
              />
            )}
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-gray-50 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-500" />
                <h2 className="text-lg font-bold text-gray-900">Performance Summary</h2>
              </div>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <p className="text-sm text-slate-600">{performanceSummary}</p>
              )}
              <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Level</span>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${riskIndicator.styles}`}>
                  {riskIndicator.label}
                </span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="border-b border-gray-50 pb-4">
              <div className="flex items-center gap-2">
                <ListChecks size={18} className="text-indigo-500" />
                <h2 className="text-lg font-bold text-gray-900">What should you do?</h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-2">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : actionGuidance.length ? (
                actionGuidance.map((item, index) => (
                  <div key={`${item}-${index}`} className="text-sm text-slate-600">
                    - {item}
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={TrendingUp}
                  title="No action needed"
                  description="Your child is on track. Keep monitoring for new updates."
                />
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader className="border-b border-gray-50 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Subject Performance</h2>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : subjects.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Marks</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subjects.map((subject) => (
                    <tr key={subject.subjectId} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{subject.code || subject.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTagStyles(subject.performanceTag)}`}>
                            {getTagLabel(subject.performanceTag)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {subject.attendancePercentage !== null ? `${subject.attendancePercentage}%` : "--"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {subject.averageMarks !== null ? subject.averageMarks : "--"}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={subject.status} />
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {getRemark(subject)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                icon={ClipboardList}
                title="No data available yet"
                description="Subject performance will appear once teachers add marks and attendance."
              />
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="border-b border-gray-50 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-500" />
              <h2 className="text-lg font-bold text-gray-900">Attendance Overview</h2>
            </div>
            <span className="text-xs text-gray-400">Attendance updated: {formatUpdatedAt(sectionUpdatedAt.attendance)}</span>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                  <span>Present</span>
                  <span>{attendance.present ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                  <span>Absent</span>
                  <span>{attendance.absent ?? 0}</span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                    <span>Overall</span>
                    <span>{attendance.percentage ?? 0}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${attendance.percentage ?? 0}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="border-b border-gray-50 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown size={18} className="text-indigo-500" />
              <h2 className="text-lg font-bold text-gray-900">Marks Overview</h2>
            </div>
            <span className="text-xs text-gray-400">Marks updated: {formatUpdatedAt(sectionUpdatedAt.marks)}</span>
          </CardHeader>
          <CardBody className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : marksOverview.length && hasMarks ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Internal</th>
                      <th className="py-3 px-4">Final</th>
                      <th className="py-3 px-4">Average</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {marksOverview.map((subject) => (
                      <tr key={subject.subjectId} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>{subject.code || subject.name}</span>
                            {subject.isNew && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                New
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {subject.internalMarks ?? "--"}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {subject.finalMarks ?? "--"}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {subject.averageMarks ?? "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={TrendingDown}
                  title="No marks published yet"
                  description="Marks will appear once teachers post them."
                />
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="border-b border-gray-50 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Attendance Trend</h2>
            <span className="text-xs text-gray-400">Attendance updated: {formatUpdatedAt(sectionUpdatedAt.attendance)}</span>
          </CardHeader>
          <CardBody className="h-80">
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : attendanceTrend.length ? (
              <>
                <Suspense fallback={<Skeleton className="h-[240px] w-full" />}>
                  <div className="w-full h-[240px]">
                    <AttendanceTrendChart data={attendanceTrend} />
                  </div>
                </Suspense>
                <p className="mt-4 text-xs text-slate-500">{attendanceInsight}</p>
              </>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No attendance trend yet"
                description="Trends appear after a few classes are marked."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="border-b border-gray-50 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Marks Trend</h2>
            <span className="text-xs text-gray-400">Marks updated: {formatUpdatedAt(sectionUpdatedAt.marks)}</span>
          </CardHeader>
          <CardBody className="h-80">
            {isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : marksTrend.length ? (
              <>
                <Suspense fallback={<Skeleton className="h-[240px] w-full" />}>
                  <div className="w-full h-[240px]">
                    <MarksTrendChart data={marksTrend} />
                  </div>
                </Suspense>
                <p className="mt-4 text-xs text-slate-500">{marksInsight}</p>
              </>
            ) : (
              <EmptyState
                icon={TrendingDown}
                title="No marks trend yet"
                description="Trends appear once marks are published."
              />
            )}
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
};

const StatCard = ({ title, value, subtitle, icon, loading }) => {
  const IconComponent = icon;
  return (
    <Card>
      <CardBody className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</p>
            {loading ? (
              <Skeleton className="mt-3 h-7 w-24" />
            ) : (
              <p className="mt-2 text-3xl font-black text-gray-900">{value}</p>
            )}
            <p className="text-xs font-medium text-gray-400 mt-1">{subtitle}</p>
          </div>
          <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
            <IconComponent size={20} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const AlertCard = ({ alert }) => {
  const palette = {
    critical: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    info: "border-slate-200 bg-slate-50 text-slate-600",
  };
  const Icon = alert.level === "critical" ? AlertTriangle : alert.level === "warning" ? AlertTriangle : CheckCircle;
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${palette[alert.level] || palette.info}`}>
      <Icon size={16} />
      <span>{alert.message}</span>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const palette = {
    GOOD: "bg-emerald-100 text-emerald-700",
    AVERAGE: "bg-amber-100 text-amber-700",
    LOW: "bg-red-100 text-red-700",
    PENDING: "bg-slate-100 text-slate-600",
  };
  const label = status === "AVERAGE" ? "Average" : status === "GOOD" ? "Good" : status === "LOW" ? "Low" : "Pending";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${palette[status] || palette.PENDING}`}>
      {label}
    </span>
  );
};

const getRiskIndicator = (criticalCount, warningCount) => {
  if (criticalCount > 0) {
    return { label: "High Risk", styles: "bg-red-100 text-red-700" };
  }
  if (warningCount > 0) {
    return { label: "Moderate Risk", styles: "bg-amber-100 text-amber-700" };
  }
  return { label: "Low Risk", styles: "bg-emerald-100 text-emerald-700" };
};

const buildPerformanceSummary = ({ subjects, attendancePercentage }) => {
  if (!subjects.length) {
    return "We'll generate a performance summary once subject data is available.";
  }
  const scoredSubjects = subjects.filter((subject) => subject.averageMarks !== null);
  if (!scoredSubjects.length) {
    return "Marks are not published yet. The summary will appear once updates arrive.";
  }
  const topSubject = [...scoredSubjects].sort((a, b) => (b.averageMarks ?? 0) - (a.averageMarks ?? 0))[0];
  const weakSubject = scoredSubjects
    .filter((subject) => subject.averageMarks < 75)
    .sort((a, b) => (a.averageMarks ?? 100) - (b.averageMarks ?? 100))[0];

  if (weakSubject) {
    const name = weakSubject.code || weakSubject.name || "a subject";
    return `Your child is performing fairly overall, but needs improvement in ${name}.`;
  }

  if (attendancePercentage !== null && attendancePercentage < 75) {
    return "Marks look steady, but attendance needs attention to stay on track.";
  }

  return `Your child is performing well overall. Strongest subject: ${topSubject.code || topSubject.name}.`;
};

const buildActionGuidance = ({ alerts, improvementSuggestion, attendancePercentage }) => {
  const guidance = [];
  const hasLowAttendance = attendancePercentage !== null && attendancePercentage < 75;
  const hasMissingMarks = alerts.some((alert) => alert.type === "marks");
  const hasMissingAttendance = alerts.some((alert) => alert.type === "attendance-missing");
  const hasCritical = alerts.some((alert) => alert.level === "critical");

  if (hasLowAttendance) {
    guidance.push("Encourage regular attendance to keep it above 75%.");
  }
  if (improvementSuggestion) {
    guidance.push(improvementSuggestion);
  }
  if (hasMissingMarks || hasMissingAttendance) {
    guidance.push("Check with the teacher for pending updates.");
  }
  if (hasCritical) {
    guidance.push("Contact the class teacher for support if needed.");
  }
  if (!guidance.length) {
    guidance.push("Keep up the steady routine and review progress weekly.");
  }
  return guidance;
};

const getAttendanceInsight = (trend) => {
  if (!trend || trend.length < 2) {
    return "Attendance insights will appear after more classes are recorded.";
  }
  const last = trend[trend.length - 1]?.percentage ?? 0;
  const prev = trend[trend.length - 2]?.percentage ?? 0;
  const diff = Number((last - prev).toFixed(1));
  if (diff > 2) return "Attendance is improving over the last few weeks.";
  if (diff < -2) return "Attendance is decreasing over the last few weeks.";
  return "Attendance is stable across recent weeks.";
};

const getMarksInsight = (trend) => {
  if (!trend || !trend.length) {
    return "Marks insights will appear once subjects receive scores.";
  }
  const sorted = [...trend].sort((a, b) => (b.average ?? 0) - (a.average ?? 0));
  const top = sorted[0];
  const low = sorted[sorted.length - 1];
  if ((top.average ?? 0) - (low.average ?? 0) < 10) {
    return "Marks are consistent across subjects.";
  }
  return `Strongest subject is ${top.subject}. Lowest score is in ${low.subject}.`;
};

const getRemark = (subject) => {
  const marks = subject.averageMarks;
  const attendance = subject.attendancePercentage;
  if (marks === null && attendance === null) return "Awaiting updates";
  if (marks === null) return "Marks pending";
  if (marks >= 85 && (attendance === null || attendance >= 80)) return "Excellent";
  if (marks >= 75) return "Good performance";
  if (marks >= 50) return "Needs improvement";
  return "Needs urgent support";
};

const getTagLabel = (tag) => {
  if (tag === "strong") return "Strong";
  if (tag === "moderate") return "Moderate";
  if (tag === "weak") return "Weak";
  return "Pending";
};

const getTagStyles = (tag) => {
  if (tag === "strong") return "bg-emerald-100 text-emerald-700";
  if (tag === "moderate") return "bg-amber-100 text-amber-700";
  if (tag === "weak") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-600";
};

const EmptyState = ({ icon, title, description }) => {
  const Icon = icon;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
      <Icon size={18} />
      <div>
        <p className="font-semibold text-slate-700">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
};

export default ParentDashboard;

