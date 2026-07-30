import Announcement from "../models/Announcement.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Attendance from "../models/Attendance.js";
import Exam from "../models/Exam.js";
import Marks from "../models/Marks.js";
import Student from "../models/Student.js";
import TeachingAssignment from "../models/TeachingAssignment.js";
import Timetable from "../models/Timetable.js";
import { resolveClassForStudent } from "../utils/classResolver.js";
import { calculateCgpaFromTotals, getGradeFromTotal, getGradePoint } from "../utils/academics.js";
import { sendError, sendSuccess } from "../utils/response.js";

const getStudentProfile = async (userId) =>
  Student.findOne({ userId })
    .populate("userId", "name email role")
    .populate("classId", "_id className branch semester section")
    .populate("assignedSubjects", "_id name code branch semester")
    .lean();

const resolveStudentSubjects = async (classDoc) => {
  if (!classDoc) return [];
  const assignments = await TeachingAssignment.find({ classId: classDoc._id })
    .populate("subjectId", "_id name code")
    .lean();
  const seen = new Set();
  const subjects = [];
  for (const assignment of assignments) {
    const subject = assignment.subjectId;
    if (!subject) continue;
    const key = String(subject._id);
    if (seen.has(key)) continue;
    seen.add(key);
    subjects.push({ _id: subject._id, name: subject.name, code: subject.code });
  }
  return subjects;
};

export const getStudentDashboard = async (req, res) => {
  try {
    const student = await getStudentProfile(req.user.userId);
    if (!student) {
      const now = new Date();
      return sendSuccess(
        res,
        {
          student: null,
          syncedAt: now,
          systemState: {
            hasTeachingAssignments: false,
            hasAssignments: false,
            hasAttendance: false,
            hasMarks: false,
            hasTimetable: false,
          },
          stats: {
            cgpa: 0,
            attendancePercentage: 0,
            assignmentsPendingCount: 0,
            assignmentsSubmittedCount: 0,
            subjectsCount: 0,
          },
          lastUpdated: {
            attendance: null,
            marks: null,
            assignments: null,
          },
          consistencyWarning: false,
          consistencyScore: null,
          subjectInsights: [],
          improvementSuggestion: null,
          attendance: {
            totalClasses: 0,
            presentClasses: 0,
            absentClasses: 0,
            percentage: 0,
          },
          attendanceTrend: [],
          assignments: {
            pending: [],
            submitted: [],
          },
          marksSummary: [],
          marksPreview: [],
          timetableToday: [],
          upcomingExams: [],
          announcements: [],
        },
        "Student dashboard fetched successfully"
      );
    }

    const classDoc = await resolveClassForStudent(student);
    if (!classDoc) {
      const now = new Date();
      return sendSuccess(
        res,
        {
          student,
          syncedAt: now,
          systemState: {
            hasTeachingAssignments: false,
            hasAssignments: false,
            hasAttendance: false,
            hasMarks: false,
            hasTimetable: false,
          },
          stats: {
            cgpa: 0,
            attendancePercentage: 0,
            assignmentsPendingCount: 0,
            assignmentsSubmittedCount: 0,
            subjectsCount: 0,
          },
          lastUpdated: {
            attendance: null,
            marks: null,
            assignments: null,
          },
          consistencyWarning: false,
          consistencyScore: null,
          subjectInsights: [],
          improvementSuggestion: null,
          attendance: {
            totalClasses: 0,
            presentClasses: 0,
            absentClasses: 0,
            percentage: 0,
          },
          attendanceTrend: [],
          assignments: {
            pending: [],
            submitted: [],
          },
          marksSummary: [],
          marksPreview: [],
          timetableToday: [],
          upcomingExams: [],
          announcements: [],
        },
        "Student dashboard fetched successfully"
      );
    }

    const subjects = await resolveStudentSubjects(classDoc);
    const subjectIds = subjects.map((subject) => subject._id);
    const hasTeachingAssignments = subjects.length > 0;


    const now = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = dayNames[now.getDay()];

    const assignmentQuery = classDoc && subjectIds.length
      ? {
          classId: classDoc._id,
          subjectId: { $in: subjectIds },
        }
      : null;

    const marksPromise = subjectIds.length
      ? Marks.find({ studentId: student._id, classId: classDoc._id, subjectId: { $in: subjectIds } })
          .populate("subjectId", "name code")
          .lean()
      : Promise.resolve([]);

    const attendancePromise = subjectIds.length
      ? Attendance.find({ studentId: student._id, classId: classDoc._id, subjectId: { $in: subjectIds } }).lean()
      : Promise.resolve([]);

    const submissionsPromise = assignmentQuery
      ? AssignmentSubmission.find({ studentId: student._id, classId: classDoc._id }).lean()
      : Promise.resolve([]);

    const examsPromise = subjectIds.length
      ? Exam.find({ subjectId: { $in: subjectIds }, date: { $gte: now } })
          .sort({ date: 1 })
          .limit(5)
          .populate("subjectId", "name code")
          .lean()
      : Promise.resolve([]);

    const timetableCountPromise = classDoc
      ? Timetable.countDocuments({ classId: classDoc._id })
      : Promise.resolve(0);

    const [marks, attendanceRows, assignments, submissions, upcomingExams, announcements, timetableRows, timetableCount] = await Promise.all([
      marksPromise,
      attendancePromise,
      assignmentQuery
        ? Assignment.find(assignmentQuery)
            .sort({ deadline: 1 })
            .populate("subjectId", "name code")
            .populate("classId", "_id className branch semester section")
            .lean()
        : [],
      submissionsPromise,
      examsPromise,
      classDoc
        ? Announcement.find({ isActive: true, target: "STUDENTS", classId: classDoc._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
        : [],
      classDoc
        ? Timetable.find({ classId: classDoc._id, day: todayName })
            .populate("subjectId", "name code")
            .populate({ path: "staffId", populate: { path: "userId", select: "name" } })
            .sort({ startTime: 1 })
            .lean()
        : [],
      timetableCountPromise,
    ]);
    const submittedSet = new Set(
      submissions
        .filter((submission) => submission.status === "submitted")
        .map((submission) => String(submission.assignmentId))
    );

    const pendingAssignments = assignments.filter((assignment) => {
      const submitted = submittedSet.has(String(assignment._id));
      if (submitted) return false;
      if (!assignment.deadline) return true;
      return assignment.deadline >= now;
    });

    const submittedAssignments = assignments.filter((assignment) => submittedSet.has(String(assignment._id)));

    const formatAssignment = (assignment) => ({
      _id: assignment._id,
      title: assignment.title,
      type: assignment.type,
      deadline: assignment.deadline,
      subject: assignment.subjectId
        ? {
            _id: assignment.subjectId._id,
            name: assignment.subjectId.name,
            code: assignment.subjectId.code,
          }
        : null,
      class: assignment.classId
        ? {
            _id: assignment.classId._id,
            name: assignment.classId.className,
            className: assignment.classId.className,
            branch: assignment.classId.branch,
            semester: assignment.classId.semester,
            section: assignment.classId.section,
          }
        : null,
    });

    const totals = marks
      .map((row) => (row.total === null || row.total === undefined ? null : Number(row.total)))
      .filter((value) => Number.isFinite(value));
    const cgpa = calculateCgpaFromTotals(totals);

    const presentClasses = attendanceRows.filter((row) => row.status === "present").length;
    const totalClasses = attendanceRows.length;
    const absentClasses = totalClasses - presentClasses;
    const attendancePercentage = totalClasses ? Number(((presentClasses / totalClasses) * 100).toFixed(2)) : 0;
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
    const attendanceTrend = Array.from(attendanceTrendMap.entries())
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

    const subjectAttendanceMap = new Map();
    attendanceRows.forEach((row) => {
      const key = String(row.subjectId || "");
      if (!key) return;
      if (!subjectAttendanceMap.has(key)) {
        subjectAttendanceMap.set(key, { present: 0, total: 0 });
      }
      const entry = subjectAttendanceMap.get(key);
      entry.total += 1;
      if (row.status === "present") entry.present += 1;
    });

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

    const lastUpdated = {
      attendance: getLatestDate(attendanceRows, ["updatedAt", "createdAt", "date"]),
      marks: getLatestDate(marks, ["updatedAt", "createdAt"]),
      assignments: getLatestDate([...assignments, ...submissions], ["updatedAt", "createdAt"]),
    };

    const marksSummaryMap = new Map();
    marks.forEach((row) => {
      const total = row.total === null || row.total === undefined ? null : Number(row.total);
      if (!Number.isFinite(total)) return;
      const subjectId = row.subjectId?._id || row.subjectId;
      const key = String(subjectId || "");
      if (!key) return;
      if (!marksSummaryMap.has(key)) {
        marksSummaryMap.set(key, {
          subjectId,
          subjectName: row.subjectId?.name || "Subject",
          subjectCode: row.subjectId?.code || "",
          totals: [],
        });
      }
      marksSummaryMap.get(key).totals.push(total);
    });

    const marksSummary = Array.from(marksSummaryMap.values()).map((item) => {
      const highest = Math.max(...item.totals);
      const lowest = Math.min(...item.totals);
      const average = item.totals.reduce((sum, value) => sum + value, 0) / item.totals.length;
      return {
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        subjectCode: item.subjectCode,
        highest,
        lowest,
        average: Number(average.toFixed(2)),
      };
    });

    const marksSummaryById = new Map(
      marksSummary.map((item) => [String(item.subjectId || ""), item]).filter(([key]) => key)
    );

    const subjectInsights = subjects.map((subject) => {
      const key = String(subject._id || "");
      const marksItem = marksSummaryById.get(key);
      const attendanceItem = subjectAttendanceMap.get(key);
      const average = marksItem ? marksItem.average : null;
      const attendancePercentage = attendanceItem && attendanceItem.total
        ? Number(((attendanceItem.present / attendanceItem.total) * 100).toFixed(2))
        : null;
      let performanceTag = "pending";
      if (average !== null) {
        performanceTag = average >= 75 ? "strong" : average >= 50 ? "moderate" : "weak";
      }
      return {
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        average,
        attendancePercentage,
        performanceTag,
      };
    });

    const marksAverages = marksSummary
      .map((item) => (Number.isFinite(item.average) ? Number(item.average) : null))
      .filter((value) => value !== null);

    let marksStability = null;
    if (marksAverages.length) {
      const mean = marksAverages.reduce((sum, value) => sum + value, 0) / marksAverages.length;
      const variance = marksAverages.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / marksAverages.length;
      const stdDev = Math.sqrt(variance);
      marksStability = Math.max(0, Math.min(100, Number((100 - stdDev).toFixed(2))));
    }

    const consistencyScore = marksStability === null
      ? Math.round(attendancePercentage)
      : Math.round((attendancePercentage + marksStability) / 2);

    const assignmentsSubjectCount = new Set(
      assignments
        .map((assignment) => String(assignment.subjectId?._id || assignment.subjectId || ""))
        .filter((value) => value)
    ).size;

    const consistencyWarning = subjects.length > 0 && (
      (marksSummary.length > 0 && marksSummary.length < subjects.length) ||
      (subjectAttendanceMap.size > 0 && subjectAttendanceMap.size < subjects.length) ||
      (assignments.length > 0 && assignmentsSubjectCount < subjects.length)
    );

    const improvementCandidate = subjectInsights
      .filter((item) =>
        (item.average !== null && item.average < 75) ||
        (item.attendancePercentage !== null && item.attendancePercentage < 75)
      )
      .sort((a, b) => {
        const scoreA = ((a.average ?? 100) + (a.attendancePercentage ?? 100)) / 2;
        const scoreB = ((b.average ?? 100) + (b.attendancePercentage ?? 100)) / 2;
        return scoreA - scoreB;
      })[0];

    const improvementSuggestion = improvementCandidate
      ? (() => {
          const name = improvementCandidate.subjectCode || improvementCandidate.subjectName || "this subject";
          const lowScore = improvementCandidate.average !== null && improvementCandidate.average < 50;
          const lowAttendance = improvementCandidate.attendancePercentage !== null && improvementCandidate.attendancePercentage < 75;
          if (lowScore && lowAttendance) {
            return `You should focus more on ${name} (low score & attendance).`;
          }
          if (lowScore) {
            return `You should focus more on ${name} (low score).`;
          }
          if (lowAttendance) {
            return `You should focus more on ${name} (low attendance).`;
          }
          return null;
        })()
      : null;

    const timetableToday = timetableRows.map((row) => ({
      _id: row._id,
      day: row.day,
      time: row.startTime + " - " + row.endTime,
      startTime: row.startTime,
      endTime: row.endTime,
      subject: row.subjectId
        ? {
            _id: row.subjectId._id,
            name: row.subjectId.name,
            code: row.subjectId.code,
          }
        : null,
      staff: row.staffId?.userId
        ? {
            _id: row.staffId._id,
            name: row.staffId.userId?.name || "Staff",
          }
        : null,
    }));
    const systemState = {
      hasTeachingAssignments,
      hasAssignments: assignments.length > 0,
      hasAttendance: attendanceRows.length > 0,
      hasMarks: marks.length > 0,
      hasTimetable: timetableCount > 0,
    };


    return sendSuccess(
      res,
      {
        student,
        syncedAt: now,
        systemState,
        stats: {
          cgpa,
          attendancePercentage,
          assignmentsPendingCount: pendingAssignments.length,
          assignmentsSubmittedCount: submittedAssignments.length,
          subjectsCount: subjects.length,
        },
        lastUpdated,
        consistencyWarning,
        consistencyScore,
        subjectInsights,
        improvementSuggestion,
        attendance: {
          totalClasses,
          presentClasses,
          absentClasses,
          percentage: attendancePercentage,
        },
        attendanceTrend,
        assignments: {
          pending: pendingAssignments.map(formatAssignment),
          submitted: submittedAssignments.map(formatAssignment),
        },
        marksSummary,
        marksPreview: marks.map((row) => ({
          subjectId: row.subjectId?._id,
          subjectName: row.subjectId?.name,
          code: row.subjectId?.code,
          total: row.total,
          grade: getGradeFromTotal(row.total || 0),
        })),
        timetableToday,
        upcomingExams,
        announcements,
      },
      "Student dashboard fetched successfully"
    );
  } catch (error) {
    return sendError(res, "Failed to fetch student dashboard", 500, [error.message]);
  }
};

export const getStudentMarks = async (req, res) => {
  try {
    const student = await getStudentProfile(req.user.userId);
    if (!student) {
      return sendSuccess(res, { student: null, cgpa: 0, marks: [] }, "Student marks fetched successfully");
    }

    const classDoc = await resolveClassForStudent(student);
    if (!classDoc) {
      return sendSuccess(res, { student, cgpa: 0, marks: [] }, "Student marks fetched successfully");
    }

    const subjects = await resolveStudentSubjects(classDoc);
    const subjectIds = subjects.map((subject) => subject._id);

    const marks = subjectIds.length
      ? await Marks.find({ studentId: student._id, classId: classDoc._id, subjectId: { $in: subjectIds } })
          .populate("subjectId", "name code branch semester")
          .sort({ updatedAt: -1 })
          .lean()
      : [];

    const formatted = marks.map((row) => {
      const grade = getGradeFromTotal(row.total || 0);
      return {
        _id: row._id,
        subject: row.subjectId,
        internal1: row.internal1,
        internal2: row.internal2,
        assignment: row.assignment,
        external: row.external,
        total: row.total,
        grade,
        gradePoint: getGradePoint(grade),
        updatedAt: row.updatedAt,
      };
    });

    const cgpa = calculateCgpaFromTotals(formatted.map((item) => item.total));

    return sendSuccess(res, { student, cgpa, marks: formatted }, "Student marks fetched successfully");
  } catch (error) {
    return sendError(res, "Failed to fetch student marks", 500, [error.message]);
  }
};

export const getStudentAttendance = async (req, res) => {
  try {
    const student = await getStudentProfile(req.user.userId);
    if (!student) {
      return sendSuccess(
        res,
        {
          student: null,
          overall: {
            totalClasses: 0,
            presentClasses: 0,
            percentage: 0,
          },
          bySubject: [],
        },
        "Student attendance fetched successfully"
      );
    }

    const classDoc = await resolveClassForStudent(student);
    if (!classDoc) {
      return sendSuccess(
        res,
        {
          student,
          overall: {
            totalClasses: 0,
            presentClasses: 0,
            percentage: 0,
          },
          bySubject: [],
        },
        "Student attendance fetched successfully"
      );
    }

    const subjects = await resolveStudentSubjects(classDoc);
    const subjectIds = subjects.map((subject) => subject._id);

    const grouped = subjectIds.length
      ? await Attendance.aggregate([
          { $match: { studentId: student._id, classId: classDoc._id, subjectId: { $in: subjectIds } } },
          {
            $group: {
              _id: "$subjectId",
              totalClasses: { $sum: 1 },
              presentClasses: {
                $sum: {
                  $cond: [{ $eq: ["$status", "present"] }, 1, 0],
                },
              },
            },
          },
          {
            $lookup: {
              from: "subjects",
              localField: "_id",
              foreignField: "_id",
              as: "subject",
            },
          },
          { $unwind: "$subject" },
          {
            $project: {
              _id: 0,
              subjectId: "$subject._id",
              subjectName: "$subject.name",
              subjectCode: "$subject.code",
              totalClasses: 1,
              presentClasses: 1,
              percentage: {
                $round: [{ $multiply: [{ $divide: ["$presentClasses", "$totalClasses"] }, 100] }, 2],
              },
            },
          },
          { $sort: { subjectName: 1 } },
        ])
      : [];

    const totals = grouped.reduce(
      (acc, row) => {
        acc.totalClasses += row.totalClasses;
        acc.presentClasses += row.presentClasses;
        return acc;
      },
      { totalClasses: 0, presentClasses: 0 }
    );

    const overallPercentage = totals.totalClasses
      ? Number(((totals.presentClasses / totals.totalClasses) * 100).toFixed(2))
      : 0;

    return sendSuccess(
      res,
      {
        student,
        overall: {
          ...totals,
          percentage: overallPercentage,
        },
        bySubject: grouped,
      },
      "Student attendance fetched successfully"
    );
  } catch (error) {
    return sendError(res, "Failed to fetch student attendance", 500, [error.message]);
  }
};
