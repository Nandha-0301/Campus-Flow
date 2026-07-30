import React, { Suspense, lazy, useMemo } from "react";
import Layout from "../../components/Layout";
import Card, { CardBody, CardHeader } from "../../components/Card";
import Skeleton from "../../components/Skeleton";
import { useAuth } from "../../context/AuthContext";
import {
  AlertTriangle,
  Bell,
  BellRing,
  BookOpen,
  Calendar,
  CalendarX,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  Inbox,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import AnnouncementCard from "../../components/AnnouncementCard";
import useStudentDashboard from "../../hooks/useStudentDashboard";

const AttendanceTrendChart = lazy(() => import("../../components/charts/AttendanceTrendChart"));
const MarksTrendChart = lazy(() => import("../../components/charts/MarksTrendChart"));

const StudentDashboard = () => {
  const { user } = useAuth();
  const {
    data: dashboard,
    loading,
    syncing,
    refreshing,
    pollingPulse,
    error,
    lastUpdated,
    nextRefreshIn,
    newUpdates,
    refresh,
    clearNewUpdates,
  } = useStudentDashboard();

  const isLoading = loading && !dashboard;

  const marksSummary = dashboard?.marksSummary || [];
  const marksPreview = dashboard?.marksPreview || [];
  const attendanceTrend = dashboard?.attendanceTrend || [];
  const subjectInsights = dashboard?.subjectInsights || [];
  const improvementSuggestion = dashboard?.improvementSuggestion || null;
  const consistencyScore = Number.isFinite(dashboard?.consistencyScore) ? dashboard.consistencyScore : null;
  const sectionUpdatedAt = dashboard?.lastUpdated || {};
  const consistencyWarning = dashboard?.consistencyWarning;

  const marksTrendData = useMemo(() => {
    if (marksSummary.length) {
      return marksSummary.map((item) => ({
        subject: item.subjectCode || item.subjectName || "Subject",
        average: item.average ?? 0,
        highest: item.highest ?? 0,
      }));
    }
    return marksPreview.map((item) => ({
      subject: item.code || item.subjectName || "Subject",
      average: item.total || 0,
      highest: item.total || 0,
    }));
  }, [marksSummary, marksPreview]);

  const attendance = dashboard?.attendance;
  const announcements = dashboard?.announcements || [];
  const timetableToday = dashboard?.timetableToday || [];
  const assignmentsPending = dashboard?.assignments?.pending || [];
  const assignmentsSubmitted = dashboard?.assignments?.submitted || [];
  const systemState = dashboard?.systemState || {};
  const classNotConfigured = systemState?.hasTeachingAssignments === false;
  const hasMarks = systemState?.hasMarks ?? marksPreview.length > 0;
  const hasAttendance = systemState?.hasAttendance ?? (attendance?.totalClasses || 0) > 0;
  const hasAssignments =
    systemState?.hasAssignments ?? assignmentsPending.length + assignmentsSubmitted.length > 0;
  const hasTimetable = systemState?.hasTimetable ?? timetableToday.length > 0;

  const attendancePercentage = dashboard?.stats?.attendancePercentage ?? 0;
  const attendanceWarning = hasAttendance && attendancePercentage < 75;

  const newAssignmentIds = useMemo(
    () => new Set((newUpdates?.assignments || []).map((id) => String(id))),
    [newUpdates]
  );
  const newAnnouncementIds = useMemo(
    () => new Set((newUpdates?.announcements || []).map((id) => String(id))),
    [newUpdates]
  );
  const notificationCount = (newUpdates?.assignments?.length || 0) + (newUpdates?.announcements?.length || 0);

  const getTimeAgo = (date) => {
    if (!date) return "Syncing...";
    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 5) return "Updated just now";
    if (diffSeconds < 60) return `Last updated ${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `Last updated ${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Last updated ${diffHours} hr ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Last updated ${diffDays}d ago`;
  };

  const formatUpdatedAt = (value) => {
    if (!value) return "Awaiting updates";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Awaiting updates";
    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 60) return "Updated just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Updated ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Updated ${diffDays}d ago`;
  };

  const statusLabel = useMemo(() => {
    if (syncing || loading || refreshing) return "Syncing...";
    if (error) {
      return nextRefreshIn ? `Error - retrying in ${nextRefreshIn}s` : "Error - retrying...";
    }
    return getTimeAgo(lastUpdated);
  }, [syncing, loading, refreshing, error, lastUpdated, nextRefreshIn]);

  const formatDeadline = (deadline) => (deadline ? new Date(deadline).toLocaleString() : "No deadline");

  const overdueAssignments = useMemo(() => {
    const now = Date.now();
    return assignmentsPending.filter(
      (assignment) => assignment.deadline && new Date(assignment.deadline).getTime() < now
    );
  }, [assignmentsPending]);

  const upcomingAssignments = useMemo(() => {
    const now = Date.now();
    return assignmentsPending.filter(
      (assignment) => !assignment.deadline || new Date(assignment.deadline).getTime() >= now
    );
  }, [assignmentsPending]);

  const performanceInsight = useMemo(() => {
    if (!marksSummary.length) return { best: null, weak: null, average: null };
    const sorted = [...marksSummary].sort((a, b) => b.average - a.average);
    const best = sorted[0];
    const weak = sorted[sorted.length - 1];
    const overallAverage =
      marksSummary.reduce((sum, item) => sum + (item.average ?? 0), 0) / marksSummary.length;
    return {
      best,
      weak,
      average: Number(overallAverage.toFixed(2)),
    };
  }, [marksSummary]);

  const hasNewUpdates = notificationCount > 0;

  return (
    <Layout>
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Student Portal</h1>
          <p className="text-gray-500 text-sm font-medium">
            Welcome back, {user?.name || user?.email || "Student"}. Your data is synced with live updates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <span
              className={`h-2 w-2 rounded-full ${
                pollingPulse ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
              }`}
            />
            <span>{statusLabel}</span>
          </div>
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 active:scale-[0.98]"
            >
              <Bell size={14} />
              Alerts
            </button>
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {notificationCount}
              </span>
            )}
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
          Your class is not fully configured yet. Please contact admin.
        </div>
      )}

      {!isLoading && consistencyWarning && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          Some data may be incomplete. Please check back as updates sync in.
        </div>
      )}

      {!isLoading && attendanceWarning && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Your attendance is below safe limit.
        </div>
      )}

      {hasNewUpdates && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          <span>
            New update{notificationCount > 1 ? "s" : ""} available -
            {newUpdates.assignments.length ? ` ${newUpdates.assignments.length} assignment` : ""}
            {newUpdates.assignments.length === 1 ? "" : newUpdates.assignments.length ? "s" : ""}
            {newUpdates.announcements.length ? ` ${newUpdates.announcements.length} announcement` : ""}
            {newUpdates.announcements.length === 1 ? "" : newUpdates.announcements.length ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={clearNewUpdates}
            className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="CGPA"
          value={dashboard?.stats?.cgpa ?? 0}
          subtitle="Based on current marks"
          icon={GraduationCap}
          accent="indigo"
          loading={isLoading}
        />
        <StatCard
          title="Attendance"
          value={`${dashboard?.stats?.attendancePercentage ?? 0}%`}
          subtitle="Overall attendance"
          icon={CheckCircle}
          accent="emerald"
          loading={isLoading}
        />
        <StatCard
          title="Assignments Due"
          value={dashboard?.stats?.assignmentsPendingCount ?? 0}
          subtitle="Upcoming pending work"
          icon={FileText}
          accent="orange"
          loading={isLoading}
        />
        <StatCard
          title="Subjects"
          value={dashboard?.stats?.subjectsCount ?? 0}
          subtitle="Current academic load"
          icon={BookOpen}
          accent="sky"
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="border-b border-gray-50 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              <h2 className="text-lg font-bold text-gray-900">Performance Insight</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : !subjectInsights.length ? (
              <EmptyState
                icon={BellRing}
                title="Marks insight pending"
                description="Insights will appear once marks are published by staff."
              />
            ) : (
              <>
                {marksSummary.length ? (
                  <>
                    <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                      <span>Best subject</span>
                      <span className="text-emerald-700">
                        {performanceInsight.best?.subjectCode || performanceInsight.best?.subjectName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                      <span>Weak subject</span>
                      <span className="text-red-600">
                        {performanceInsight.weak?.subjectCode || performanceInsight.weak?.subjectName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                      <span>Average score</span>
                      <span className="text-slate-900">{performanceInsight.average}%</span>
                    </div>
                    {consistencyScore !== null && (
                      <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                        <span>Consistency</span>
                        <span className="text-indigo-700">{consistencyScore}%</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    Marks insight pending. Tags will activate once marks are published.
                  </div>
                )}
                {subjectInsights.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Subject Tags
                    </p>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
                      {subjectInsights.map((subject) => (
                        <div key={String(subject.subjectId || subject.subjectCode || subject.subjectName)} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700">
                            {subject.subjectCode || subject.subjectName}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTagStyles(subject.performanceTag)}`}>
                            {getTagLabel(subject.performanceTag)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>

        <Card className={attendanceWarning ? "border-red-200 shadow-red-100" : ""}>
          <CardHeader className="border-b border-gray-50 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className={attendanceWarning ? "text-red-500" : "text-emerald-500"} />
              <h2 className="text-lg font-bold text-gray-900">Attendance Status</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
            ) : !hasAttendance ? (
              <EmptyState
                icon={ShieldCheck}
                title="Attendance not tracked yet"
                description="Attendance insights will appear once staff start marking classes."
              />
            ) : attendanceWarning ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Your attendance is below safe limit.
                <p className="mt-1 text-xs text-red-600">Attend upcoming classes to recover above 75%.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                Attendance is in the safe zone.
                <p className="mt-1 text-xs text-emerald-600">Keep it above 75% to stay exam-eligible.</p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className={overdueAssignments.length > 0 ? "border-red-200 shadow-red-100" : ""}>
          <CardHeader className="border-b border-gray-50 pb-4">
            <div className="flex items-center gap-2">
              <TrendingDown size={18} className={overdueAssignments.length ? "text-red-500" : "text-indigo-500"} />
              <h2 className="text-lg font-bold text-gray-900">Assignment Alert</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : overdueAssignments.length ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {overdueAssignments.length} overdue assignment{overdueAssignments.length === 1 ? "" : "s"}.
                <p className="mt-1 text-xs text-red-600">Submit them to remove the alert.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                No overdue assignments right now.
                <p className="mt-1 text-xs text-slate-500">Stay ahead by checking upcoming deadlines.</p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="border-b border-gray-50 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-500" />
              <h2 className="text-lg font-bold text-gray-900">Improvement Tip</h2>
            </div>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : improvementSuggestion ? (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-700">
                {improvementSuggestion}
              </div>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No improvement flags"
                description="You're on track. We'll highlight focus areas if needed."
              />
            )}
          </CardBody>
        </Card>
      </div>

      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 transition-opacity duration-300 ${
          syncing || refreshing ? "opacity-75" : "opacity-100"
        }`}
      >
        <Card className={classNotConfigured ? "opacity-60 pointer-events-none" : ""}>
          <CardHeader className="border-b border-gray-50 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Attendance Trend</h2>
            <span className="text-xs text-gray-400">{formatUpdatedAt(sectionUpdatedAt.attendance)}</span>
          </CardHeader>
          <CardBody className="h-72 pt-6">
            {classNotConfigured ? (
              <p className="text-sm text-gray-500">Attendance trend is unavailable until class setup is complete.</p>
            ) : isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : !attendanceTrend.length ? (
              <EmptyState
                icon={CalendarX}
                title="No attendance trend yet"
                description="Monthly attendance will appear once enough classes are marked."
              />
            ) : (
              <Suspense fallback={<Skeleton className="h-[240px] w-full" />}>
                <div className="w-full h-[240px]">
                  <AttendanceTrendChart data={attendanceTrend} />
                </div>
              </Suspense>
            )}
          </CardBody>
        </Card>

        <Card className={`lg:col-span-1 ${classNotConfigured ? "opacity-60 pointer-events-none" : ""}`}>
          <CardHeader className="border-b border-gray-50 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Marks Trend</h2>
            <span className="text-xs text-gray-400">{formatUpdatedAt(sectionUpdatedAt.marks)}</span>
          </CardHeader>
          <CardBody className="h-72 pt-6">
            {classNotConfigured ? (
              <p className="text-sm text-gray-500">Marks unavailable until class setup is complete.</p>
            ) : isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : !hasMarks ? (
              <EmptyState
                icon={BellRing}
                title="Marks not published"
                description="Marks trend will appear once staff publish results."
              />
            ) : (
              <Suspense fallback={<Skeleton className="h-[240px] w-full" />}>
                <div className="w-full h-[240px]">
                  <MarksTrendChart data={marksTrendData} />
                </div>
              </Suspense>
            )}
          </CardBody>
        </Card>
      </div>

      <div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 transition-opacity duration-300 ${
          syncing || refreshing ? "opacity-75" : "opacity-100"
        }`}
      >
        <Card className={classNotConfigured ? "opacity-60 pointer-events-none" : ""}>
          <CardHeader className="border-b border-gray-50 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : announcements.length ? (
              announcements.map((item) => (
                <AnnouncementCard
                  key={item._id}
                  title={item.title}
                  description={item.description}
                  type={item.type}
                  isNew={newAnnouncementIds.has(String(item._id))}
                />
              ))
            ) : (
              <EmptyState
                icon={Inbox}
                title="No announcements yet"
                description="Announcements will appear once staff post them."
              />
            )}
          </CardBody>
        </Card>

        <Card className={classNotConfigured ? "opacity-60 pointer-events-none" : ""}>
          <CardHeader className="border-b border-gray-50 pb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-orange-500" />
              <h2 className="text-lg font-bold text-gray-900">Upcoming Exams</h2>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {classNotConfigured ? (
              <p className="p-4 text-sm text-gray-500">Exams unavailable until class setup is complete.</p>
            ) : isLoading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {(dashboard?.upcomingExams || []).map((exam) => (
                  <div key={exam._id} className="p-4">
                    <p className="text-sm font-bold text-gray-900">{exam.subjectId?.name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(exam.date).toLocaleString()} | Hall: {exam.hall} | {exam.type}
                    </p>
                  </div>
                ))}
                {!loading && !(dashboard?.upcomingExams || []).length && (
                  <EmptyState
                    icon={CalendarX}
                    title="No exams scheduled"
                    description="Exams will appear after staff schedule them."
                  />
                )}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className={classNotConfigured ? "opacity-60 pointer-events-none" : ""}>
          <CardHeader className="border-b border-gray-50 pb-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-indigo-500" />
              <h2 className="text-lg font-bold text-gray-900">Today's Timetable</h2>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-50">
              {isLoading && (
                <div className="space-y-3 p-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )}
              {!isLoading &&
                timetableToday.map((slot) => (
                  <div key={slot._id} className="p-4">
                    <p className="text-sm font-bold text-gray-900">{slot.subject?.name || "Subject"}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {slot.time} {slot.staff?.name ? `| ${slot.staff.name}` : ""}
                    </p>
                  </div>
                ))}
              {!isLoading && classNotConfigured && (
                <p className="p-4 text-sm text-gray-500">Timetable unavailable until class setup is complete.</p>
              )}
              {!isLoading && !classNotConfigured && !hasTimetable && (
                <EmptyState
                  icon={CalendarX}
                  title="Timetable not assigned"
                  description="Timetable will appear once staff finalize the schedule."
                />
              )}
              {!isLoading && hasTimetable && !timetableToday.length && (
                <EmptyState
                  icon={CalendarX}
                  title="No classes scheduled"
                  description="Enjoy the break. Check again for the next day."
                />
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity duration-300 ${
          syncing || refreshing ? "opacity-75" : "opacity-100"
        }`}
      >
        <Card className={classNotConfigured ? "opacity-60 pointer-events-none" : ""}>
          <CardHeader className="border-b border-gray-50 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-500" />
              <h2 className="text-lg font-bold text-gray-900">Attendance Summary</h2>
            </div>
            <span className="text-xs text-gray-400">{formatUpdatedAt(sectionUpdatedAt.attendance)}</span>
          </CardHeader>
          <CardBody>
            {classNotConfigured ? (
              <p className="text-sm text-gray-500">Attendance unavailable until class setup is complete.</p>
            ) : isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>
            ) : !hasAttendance ? (
              <EmptyState
                icon={ShieldCheck}
                title="Attendance not available"
                description="Attendance details will appear once staff mark classes."
              />
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-gray-700 font-semibold">Total Classes: {attendance?.totalClasses ?? 0}</p>
                <p className="text-gray-700 font-semibold">Present: {attendance?.presentClasses ?? 0}</p>
                <p className="text-gray-700 font-semibold">Absent: {attendance?.absentClasses ?? 0}</p>
                <p className={`font-bold ${attendanceWarning ? "text-red-600" : "text-emerald-700"}`}>
                  Overall: {attendance?.percentage ?? 0}%
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className={overdueAssignments.length > 0 ? "border-red-200 shadow-red-100" : ""}>
          <CardHeader className="border-b border-gray-50 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={18} className={overdueAssignments.length ? "text-red-500" : "text-indigo-500"} />
              <h2 className="text-lg font-bold text-gray-900">Assignments</h2>
            </div>
            <span className="text-xs text-gray-400">{formatUpdatedAt(sectionUpdatedAt.assignments)}</span>
          </CardHeader>
          <CardBody className="space-y-3">
            {classNotConfigured ? (
              <p className="text-sm text-gray-500">Assignments unavailable until class setup is complete.</p>
            ) : isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !hasAssignments ? (
              <EmptyState
                icon={Inbox}
                title="No assignments yet"
                description="Assignments will appear once staff assigns them."
              />
            ) : (
              <>
                <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                  <span>Pending</span>
                  <span>{assignmentsPending.length}</span>
                </div>
                {overdueAssignments.length > 0 && (
                  <div className="space-y-2 text-sm">
                    <p className="text-xs font-semibold uppercase text-red-600">Overdue</p>
                    {overdueAssignments.slice(0, 2).map((assignment) => (
                      <div key={assignment._id} className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-red-800">{assignment.title}</p>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            Overdue
                          </span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                          {assignment.subject?.code || assignment.subject?.name || "Subject"} -{" "}
                          {formatDeadline(assignment.deadline)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {upcomingAssignments.length ? (
                  <div className="space-y-2 text-sm">
                    {upcomingAssignments.slice(0, 3).map((assignment) => (
                      <div
                        key={assignment._id}
                        className={`rounded-lg border p-3 transition hover:-translate-y-0.5 ${
                          newAssignmentIds.has(String(assignment._id))
                            ? "border-indigo-200 bg-indigo-50"
                            : "border-gray-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-gray-900">{assignment.title}</p>
                          {newAssignmentIds.has(String(assignment._id)) && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {assignment.subject?.code || assignment.subject?.name || "Subject"} -{" "}
                          {formatDeadline(assignment.deadline)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No pending assignments.</p>
                )}
                <p className="text-sm text-gray-600 font-semibold">
                  Submitted: <span className="text-gray-900">{assignmentsSubmitted.length}</span>
                </p>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
};

const StatCard = ({ title, value, subtitle, icon, accent, loading }) => {
  const IconComponent = icon;
  const palette = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    sky: "bg-sky-50 text-sky-600",
  };

  return (
    <Card>
      <CardBody className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</p>
            {loading ? <Skeleton className="mt-3 h-7 w-24" /> : <p className="text-3xl font-black text-gray-900 mt-2">{value}</p>}
            <p className="text-xs font-medium text-gray-400 mt-1">{subtitle}</p>
          </div>
          <div className={`rounded-2xl p-3 ${palette[accent]}`}>
            <IconComponent size={22} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
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

export default StudentDashboard;

