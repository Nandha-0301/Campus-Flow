import Attendance from "../models/Attendance.js";
import Assignment from "../models/Assignment.js";
import Marks from "../models/Marks.js";
import Student from "../models/Student.js";
import TeachingAssignment from "../models/TeachingAssignment.js";
import { resolveClassForStudent } from "../utils/classResolver.js";
import { sendError, sendSuccess } from "../utils/response.js";

const buildAttendanceTrend = (attendanceRows) => {
  const attendanceTrendMap = new Map();
  attendanceRows.forEach((row) => {
    if (!row.date) return;
    const date = new Date(row.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!attendanceTrendMap.has(monthKey)) {
      attendanceTrendMap.set(monthKey, { present: 0, total: 0 });
    }
    const entry = attendanceTrendMap.get(monthKey);
    entry.total += 1;
    if (row.status === "present") entry.present += 1;
  });

  return Array.from(attendanceTrendMap.entries())
    .map(([key, value]) => {
      const [year, month] = key.split("-").map((val) => Number(val));
      const date = new Date(year, month - 1, 1);
      const label = date.toLocaleString("en-US", { month: "short" });
      const percentage = value.total ? Number(((value.present / value.total) * 100).toFixed(2)) : 0;
      return {
        month: label,
        monthIndex: date.getTime(),
        percentage,
        present: value.present,
        total: value.total,
      };
    })
    .sort((a, b) => a.monthIndex - b.monthIndex)
    .slice(-6)
    .map(({ month, percentage, present, total }) => ({ month, percentage, present, total }));
};

const getLatestDate = (rows, fields) => {
  let latest = null;
  rows.forEach((row) => {
    fields.forEach((field) => {
      const value = row?.[field];
      if (!value) return;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return;
      if (!latest || date > latest) latest = date;
    });
  });
  return latest ? latest.toISOString() : null;
};

const getStatusFromScore = (value) => {
  if (value === null || value === undefined) return "PENDING";
  if (value >= 75) return "GOOD";
  if (value >= 50) return "AVERAGE";
  return "LOW";
};

const getPerformanceTag = (value) => {
  if (value === null || value === undefined) return "pending";
  if (value >= 75) return "strong";
  if (value >= 50) return "moderate";
  return "weak";
};

const isRecent = (row, fields, threshold) =>
  fields.some((field) => {
    const value = row?.[field];
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date >= threshold;
  });

export const getParentDashboard = async (req, res) => {
  try {
    const now = new Date();
    const children = await Student.find({ parentId: req.user.userId })
      .populate("userId", "name email")
      .lean();

    if (!children.length) {
      return sendSuccess(
        res,
        {
          syncedAt: now,
          children: [],
        },
        "Parent dashboard fetched successfully"
      );
    }
    const recentThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const dashboard = await Promise.all(
      children.map(async (child) => {
        const classDoc = await resolveClassForStudent(child);
        const className = classDoc?.className
          ? classDoc.className
          : classDoc
            ? `${classDoc.branch}-${classDoc.semester}-${classDoc.section}`
            : "N/A";

        const teachingAssignments = classDoc
          ? await TeachingAssignment.find({ classId: classDoc._id })
              .populate("subjectId", "name code")
              .lean()
          : [];

        const subjects = [];
        const seen = new Set();
        teachingAssignments.forEach((assignment) => {
          const subject = assignment.subjectId;
          if (!subject) return;
          const key = String(subject._id || subject);
          if (seen.has(key)) return;
          seen.add(key);
          subjects.push({
            _id: subject._id,
            name: subject.name,
            code: subject.code,
          });
        });

        const subjectIds = subjects.map((subject) => subject._id).filter(Boolean);
        const hasTeachingAssignments = subjectIds.length > 0;

        const [marksRows, attendanceRows, assignments] = await Promise.all([
          hasTeachingAssignments
            ? Marks.find({
                studentId: child._id,
                classId: classDoc?._id,
                subjectId: { $in: subjectIds },
              })
                .populate("subjectId", "name code")
                .lean()
            : Promise.resolve([]),
          hasTeachingAssignments
            ? Attendance.find({
                studentId: child._id,
                classId: classDoc?._id,
                subjectId: { $in: subjectIds },
              }).lean()
            : Promise.resolve([]),
          hasTeachingAssignments
            ? Assignment.find({
                classId: classDoc?._id,
                subjectId: { $in: subjectIds },
              })
                .populate("subjectId", "name code")
                .lean()
            : Promise.resolve([]),
        ]);

        const attendanceMap = new Map();
        attendanceRows.forEach((row) => {
          const key = String(row.subjectId || "");
          if (!key) return;
          if (!attendanceMap.has(key)) {
            attendanceMap.set(key, { present: 0, total: 0 });
          }
          const entry = attendanceMap.get(key);
          entry.total += 1;
          if (row.status === "present") entry.present += 1;
        });

        const marksMap = new Map();
        marksRows.forEach((row) => {
          const key = String(row.subjectId?._id || row.subjectId || "");
          if (!key) return;
          if (!marksMap.has(key)) {
            marksMap.set(key, { totals: [], internalTotals: [], finals: [] });
          }
          const entry = marksMap.get(key);
          const total = row.total === null || row.total === undefined ? null : Number(row.total);
          if (Number.isFinite(total)) entry.totals.push(total);
          const internalTotal = (row.internal1 || 0) + (row.internal2 || 0) + (row.assignment || 0);
          const finalTotal = row.external ?? null;
          entry.internalTotals.push(internalTotal);
          if (finalTotal !== null && finalTotal !== undefined) entry.finals.push(Number(finalTotal));
        });

        const subjectsPerformance = subjects.map((subject) => {
          const key = String(subject._id || "");
          const attendanceEntry = attendanceMap.get(key);
          const attendancePercentage = attendanceEntry && attendanceEntry.total
            ? Number(((attendanceEntry.present / attendanceEntry.total) * 100).toFixed(2))
            : null;

          const marksEntry = marksMap.get(key);
          const averageMarks = marksEntry && marksEntry.totals.length
            ? Number((marksEntry.totals.reduce((sum, value) => sum + value, 0) / marksEntry.totals.length).toFixed(2))
            : null;
          const internalMarks = marksEntry && marksEntry.internalTotals.length
            ? Number((marksEntry.internalTotals.reduce((sum, value) => sum + value, 0) / marksEntry.internalTotals.length).toFixed(2))
            : null;
          const finalMarks = marksEntry && marksEntry.finals.length
            ? Number((marksEntry.finals.reduce((sum, value) => sum + value, 0) / marksEntry.finals.length).toFixed(2))
            : null;

          return {
            subjectId: subject._id,
            name: subject.name,
            code: subject.code,
            attendancePercentage,
            averageMarks,
            internalMarks,
            finalMarks,
            status: getStatusFromScore(averageMarks),
            performanceTag: getPerformanceTag(averageMarks),
          };
        });

        const recentMarksRows = marksRows.filter((row) => isRecent(row, ["updatedAt", "createdAt"], recentThreshold));
        const newMarksMap = new Map();
        recentMarksRows.forEach((row) => {
          const subject = row.subjectId;
          const key = String(subject?._id || row.subjectId || "");
          if (!key || newMarksMap.has(key)) return;
          newMarksMap.set(key, {
            subjectId: subject?._id || row.subjectId,
            name: subject?.name,
            code: subject?.code,
            updatedAt: row.updatedAt || row.createdAt,
          });
        });
        const newMarksSubjects = Array.from(newMarksMap.values()).sort((a, b) =>
          new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
        );
        const newMarksSubjectIds = new Set(newMarksSubjects.map((item) => String(item.subjectId || "")));

        const recentAssignments = assignments
          .filter((row) => isRecent(row, ["updatedAt", "createdAt"], recentThreshold))
          .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
        const newAssignments = recentAssignments.map((assignment) => ({
          id: assignment._id,
          title: assignment.title,
          deadline: assignment.deadline,
          createdAt: assignment.createdAt,
          subject: assignment.subjectId
            ? {
                id: assignment.subjectId._id,
                name: assignment.subjectId.name,
                code: assignment.subjectId.code,
              }
            : null,
        }));

        const totals = subjectsPerformance
          .map((subject) => subject.averageMarks)
          .filter((value) => Number.isFinite(value));
        const averageMarks = totals.length
          ? Number((totals.reduce((sum, value) => sum + value, 0) / totals.length).toFixed(2))
          : null;

        const totalClasses = attendanceRows.length;
        const presentClasses = attendanceRows.filter((row) => row.status === "present").length;
        const absentClasses = totalClasses - presentClasses;
        const attendancePercentage = totalClasses
          ? Number(((presentClasses / totalClasses) * 100).toFixed(2))
          : 0;

        const lowPerformanceSubject = subjectsPerformance
          .filter((subject) => subject.averageMarks !== null && subject.averageMarks < 50)
          .sort((a, b) => (a.averageMarks ?? 100) - (b.averageMarks ?? 100))[0];

        const missingMarks = subjectsPerformance.some((subject) => subject.averageMarks === null);

        const alerts = [];
        if (!hasTeachingAssignments) {
          alerts.push({
            type: "configuration",
            level: "warning",
            message: "Class not fully configured",
          });
        }
        if (attendancePercentage < 75 && totalClasses > 0) {
          alerts.push({
            type: "attendance",
            level: "critical",
            message: "Attendance below safe level",
          });
        }
        if (lowPerformanceSubject) {
          alerts.push({
            type: "performance",
            level: "critical",
            message: `Performance is low in ${lowPerformanceSubject.code || lowPerformanceSubject.name}`,
          });
        }
        if (missingMarks) {
          alerts.push({
            type: "marks",
            level: "warning",
            message: "Marks not published yet",
          });
        }
        if (hasTeachingAssignments && attendanceRows.length === 0) {
          alerts.push({
            type: "attendance-missing",
            level: "warning",
            message: "Attendance not updated yet",
          });
        }

        const consistencyWarning = subjectsPerformance.some(
          (subject) => subject.attendancePercentage === null || subject.averageMarks === null
        );

        const improvementCandidate = subjectsPerformance
          .filter(
            (subject) =>
              (subject.averageMarks !== null && subject.averageMarks < 75) ||
              (subject.attendancePercentage !== null && subject.attendancePercentage < 75)
          )
          .sort((a, b) => {
            const scoreA = ((a.averageMarks ?? 100) + (a.attendancePercentage ?? 100)) / 2;
            const scoreB = ((b.averageMarks ?? 100) + (b.attendancePercentage ?? 100)) / 2;
            return scoreA - scoreB;
          })[0];

        const improvementSuggestion = improvementCandidate
          ? (() => {
              const name = improvementCandidate.code || improvementCandidate.name || "this subject";
              const lowScore = improvementCandidate.averageMarks !== null && improvementCandidate.averageMarks < 50;
              const lowAttendance = improvementCandidate.attendancePercentage !== null && improvementCandidate.attendancePercentage < 75;
              if (lowScore && lowAttendance) {
                return `Focus on ${name} and improve attendance.`;
              }
              if (lowScore) {
                return `Focus more on ${name} to improve marks.`;
              }
              if (lowAttendance) {
                return `Improve attendance for ${name} to stay on track.`;
              }
              return null;
            })()
          : null;

        const attendanceTrend = buildAttendanceTrend(attendanceRows);
        const hasMarks = subjectsPerformance.some((subject) => subject.averageMarks !== null);
        const marksTrend = hasMarks
          ? subjectsPerformance.map((subject) => ({
              subject: subject.code || subject.name || "Subject",
              average: subject.averageMarks ?? 0,
            }))
          : [];

        const lastUpdated = {
          attendance: getLatestDate(attendanceRows, ["updatedAt", "createdAt", "date"]),
          marks: getLatestDate(marksRows, ["updatedAt", "createdAt"]),
        };

        return {
          student: {
            id: child._id,
            name: child.userId?.name || "Student",
            className,
          },
          systemState: {
            hasTeachingAssignments,
          },
          stats: {
            attendancePercentage,
            averageMarks,
            subjectsCount: subjects.length,
            alertsCount: alerts.length,
          },
          attendance: {
            present: presentClasses,
            absent: absentClasses,
            percentage: attendancePercentage,
          },
          subjects: subjectsPerformance,
          marksOverview: subjectsPerformance.map((subject) => ({
            subjectId: subject.subjectId,
            name: subject.name,
            code: subject.code,
            internalMarks: subject.internalMarks,
            finalMarks: subject.finalMarks,
            averageMarks: subject.averageMarks,
            isNew: newMarksSubjectIds.has(String(subject.subjectId || "")),
          })),
          alerts,
          improvementSuggestion,
          notifications: {
            newMarksCount: newMarksSubjects.length,
            newAssignmentsCount: newAssignments.length,
            newMarksSubjects,
            newAssignments,
          },
          attendanceTrend,
          marksTrend,
          consistencyWarning,
          lastUpdated,
        };
      })
    );

    return sendSuccess(
      res,
      {
        syncedAt: now,
        children: dashboard,
      },
      "Parent dashboard fetched successfully"
    );
  } catch (error) {
    return sendError(res, "Failed to fetch parent dashboard", 500, [error.message]);
  }
};

