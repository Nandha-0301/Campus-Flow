import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import Card, { CardBody, CardHeader } from "../../components/Card";
import Error from "../../components/Error";
import Loader from "../../components/Loader";
import useUnsavedChanges from "../../hooks/useUnsavedChanges";
import { getStaffAssignments, getStaffAttendance, getStaffClassStudents, saveAttendance } from "../../api/campusflow";

const Attendance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [initialAttendanceMap, setInitialAttendanceMap] = useState({});
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [editMode, setEditMode] = useState(false);
  const [search, setSearch] = useState("");
  const [filterAbsent, setFilterAbsent] = useState(false);
  const [activeRowId, setActiveRowId] = useState(null);
  const checkboxRefs = useRef([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getStaffAssignments();
        console.log("API:", response);
        const list = response.assignments || [];
        setAssignments(list);
        const firstClass = list.find((item) => item.classId?._id)?.classId?._id || "";
        setSelectedClassId((prev) => prev || firstClass);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load assignments");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const classOptions = useMemo(() => {
    const map = new Map();
    assignments.forEach((assignment) => {
      const classInfo = assignment.classId;
      if (classInfo?._id) map.set(String(classInfo._id), classInfo);
    });
    return Array.from(map.values());
  }, [assignments]);

  const subjectOptions = useMemo(() => {
    if (!selectedClassId) return [];
    const map = new Map();
    assignments.forEach((assignment) => {
      if (String(assignment.classId?._id) !== String(selectedClassId)) return;
      const subjectInfo = assignment.subjectId;
      if (subjectInfo?._id) map.set(String(subjectInfo._id), subjectInfo);
    });
    return Array.from(map.values());
  }, [assignments, selectedClassId]);

  useEffect(() => {
    const firstSubject = subjectOptions[0]?._id || "";
    setSelectedSubjectId((prev) =>
      subjectOptions.some((subject) => String(subject._id) === String(prev)) ? prev : firstSubject
    );
  }, [subjectOptions]);

  useEffect(() => {
    setEditMode(false);
    setSaveStatus("idle");
  }, [selectedClassId, selectedSubjectId, attendanceDate]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClassId) {
        setStudents([]);
        return;
      }
      try {
        setStudentsLoading(true);
        setStudentsError("");
        const response = await getStaffClassStudents(selectedClassId);
        console.log("API:", response);
        const list = response.students || [];
        setStudents(list);
        const seed = {};
        list.forEach((student) => {
          seed[student._id] = true;
        });
        setAttendanceMap(seed);
        setInitialAttendanceMap(seed);
      } catch (err) {
        setStudentsError(err?.response?.data?.message || "Failed to load students");
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudents();
  }, [selectedClassId]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = students;
    if (query) {
      list = list.filter((student) => {
        const name = student.userId?.name?.toLowerCase() || "";
        const usn = student.usn?.toLowerCase() || "";
        return name.includes(query) || usn.includes(query);
      });
    }
    if (filterAbsent) {
      list = list.filter((student) => !attendanceMap[student._id]);
    }
    return list;
  }, [students, search, filterAbsent, attendanceMap]);

  const presentCount = useMemo(() => students.filter((student) => attendanceMap[student._id]).length, [students, attendanceMap]);
  const absentCount = useMemo(() => Math.max(0, students.length - presentCount), [students.length, presentCount]);
  const attendancePercent = students.length ? Math.round((presentCount / students.length) * 100) : 0;
  const missingCount = useMemo(
    () => students.filter((student) => attendanceMap[student._id] === undefined).length,
    [students, attendanceMap]
  );

  const hasUnsavedChanges = useMemo(() => {
    if (!students.length) return false;
    return students.some(
      (student) => Boolean(attendanceMap[student._id]) !== Boolean(initialAttendanceMap[student._id])
    );
  }, [students, attendanceMap, initialAttendanceMap]);

  useUnsavedChanges(hasUnsavedChanges);

  useEffect(() => {
    if (saveStatus === "saved" || saveStatus === "error") {
      const timer = setTimeout(() => setSaveStatus("idle"), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [saveStatus]);

  const markAllPresent = () => {
    const next = {};
    students.forEach((student) => {
      next[student._id] = true;
    });
    setAttendanceMap(next);
  };

  const resetAttendance = () => {
    setAttendanceMap(initialAttendanceMap);
  };

  const loadPreviousAttendance = async () => {
    if (!selectedClassId || !selectedSubjectId || !attendanceDate) {
      toast.error("Select class, subject, and date first");
      return;
    }

    try {
      const response = await getStaffAttendance({
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        date: attendanceDate,
      });
      console.log("API:", response);
      const map = {};
      students.forEach((student) => {
        map[student._id] = false;
      });
      (response.attendance || []).forEach((item) => {
        map[item.studentId] = item.status === "present";
      });
      setAttendanceMap(map);
      setInitialAttendanceMap(map);
      setEditMode(Boolean(response.attendance?.length));
      setSaveStatus("idle");
      toast.success("Loaded previous attendance");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load attendance");
    }
  };

  const handleSubmit = async () => {
    if (!selectedClassId || !selectedSubjectId) {
      toast.error("Select class and subject first");
      return;
    }
    if (!attendanceDate) {
      toast.error("Select attendance date");
      return;
    }
    if (missingCount > 0) {
      toast.error(`Missing entries for ${missingCount} students`);
      return;
    }

    try {
      setSaving(true);
      setSaveStatus("saving");
      const entries = students.map((student) => ({
        studentId: student._id,
        status: attendanceMap[student._id] ? "present" : "absent",
      }));

      const response = await saveAttendance({
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        date: attendanceDate,
        allowUpdate: editMode,
        entries,
      });

      setInitialAttendanceMap({ ...attendanceMap });
      setEditMode(false);
      setSaveStatus("saved");
      const queued = response?.notificationsQueued || 0;
      toast.success(
        queued > 0
          ? `Attendance saved. Notifications queued for ${queued} students`
          : "Attendance saved"
      );
    } catch (err) {
      setSaveStatus("error");
      toast.error(err?.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckboxKeyDown = (event, index) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      checkboxRefs.current[index + 1]?.focus();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      checkboxRefs.current[index - 1]?.focus();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      checkboxRefs.current[index + 1]?.focus();
    }
  };

  if (loading) return <Loader className="min-h-[60vh]" />;
  if (error) return <Error message={error} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Attendance</h1>
        <p className="mt-2 text-sm text-gray-500">Select class and subject to mark attendance.</p>
      </div>

      {!classOptions.length && (
        <Card className="mb-6">
          <CardBody>
            <p className="text-sm font-semibold text-gray-700">No assignments found. Contact admin.</p>
          </CardBody>
        </Card>
      )}

      <Card className="mb-6">
        <CardBody className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Class</label>
            <select
              className="rounded-xl border border-gray-200 px-3 py-2"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={!classOptions.length}
            >
              {classOptions.length ? (
                classOptions.map((classInfo) => (
                  <option key={classInfo._id} value={classInfo._id}>
                    {classInfo.className ||
                      [classInfo.branch, classInfo.semester, classInfo.section].filter(Boolean).join(" ")}
                  </option>
                ))
              ) : (
                <option value="">No classes assigned</option>
              )}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Subject</label>
            <select
              className="rounded-xl border border-gray-200 px-3 py-2"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={!subjectOptions.length}
            >
              {subjectOptions.length ? (
                subjectOptions.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.code} - {subject.name}
                  </option>
                ))
              ) : (
                <option value="">No subjects assigned</option>
              )}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Date</label>
            <input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              className="rounded-xl border border-gray-200 px-3 py-2"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              onClick={handleSubmit}
              disabled={saving || !students.length || !selectedSubjectId || !selectedClassId || missingCount > 0}
            >
              {saving ? "Saving..." : "Save Attendance"}
            </button>
            {saveStatus !== "idle" && (
              <span
                className={`text-xs font-semibold ${
                  saveStatus === "saving"
                    ? "text-blue-600"
                    : saveStatus === "saved"
                      ? "text-emerald-600"
                      : "text-red-600"
                }`}
              >
                {saveStatus === "saving" && "Saving..."}
                {saveStatus === "saved" && "Saved"}
                {saveStatus === "error" && "Error"}
              </span>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Present</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{presentCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Absent</p>
            <p className="mt-2 text-2xl font-bold text-rose-500">{absentCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Attendance %</p>
            <p className="mt-2 text-2xl font-bold text-indigo-600">{attendancePercent}%</p>
            <div className="mt-3 h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-indigo-500"
                style={{ width: `${attendancePercent}%` }}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6">
        <CardBody className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Search student"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                className="h-4 w-4 accent-orange-500"
                checked={filterAbsent}
                onChange={(e) => setFilterAbsent(e.target.checked)}
              />
              Show absent only
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
              onClick={markAllPresent}
              disabled={!students.length}
            >
              Mark All Present
            </button>
            <button
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"
              onClick={resetAttendance}
              disabled={!students.length}
            >
              Reset
            </button>
            <button
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
              onClick={loadPreviousAttendance}
              disabled={!students.length || !selectedSubjectId || !selectedClassId}
            >
              Load Previous Data
            </button>
          </div>
        </CardBody>
      </Card>

      {editMode && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Editing previous data
        </div>
      )}

      {missingCount > 0 && (
        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Missing entries for {missingCount} students
        </div>
      )}

      {studentsError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {studentsError}
        </div>
      )}

      <Card>
        <CardHeader className="border-b border-gray-50 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Class Register</h2>
        </CardHeader>
        <div className="p-0">
          {studentsLoading ? (
            <div className="p-6">
              <Loader />
            </div>
          ) : students.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No students assigned to this class</div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              <table className="min-w-full text-left">
                <thead className="sticky top-0 z-10 bg-white text-xs uppercase tracking-wider text-gray-500">
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3">Present</th>
                    <th className="px-6 py-3">Student ID</th>
                    <th className="px-6 py-3">Student Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((student, index) => {
                    const isActive = activeRowId === student._id;
                    return (
                      <tr
                        key={student._id}
                        className={`transition-colors ${
                          isActive ? "bg-indigo-50" : "hover:bg-indigo-50/50"
                        }`}
                        onMouseEnter={() => setActiveRowId(student._id)}
                      >
                        <td className="px-6 py-3">
                          <input
                            ref={(el) => {
                              checkboxRefs.current[index] = el;
                            }}
                            type="checkbox"
                            className="h-4 w-4 accent-emerald-600"
                            checked={Boolean(attendanceMap[student._id])}
                            onChange={(e) =>
                              setAttendanceMap((prev) => ({
                                ...prev,
                                [student._id]: e.target.checked,
                              }))
                            }
                            onFocus={() => setActiveRowId(student._id)}
                            onKeyDown={(event) => handleCheckboxKeyDown(event, index)}
                          />
                        </td>
                        <td className="px-6 py-3">
                          <span className="font-mono text-xs text-gray-600">{student.usn}</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="font-semibold text-gray-900">{student.userId?.name}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Attendance;
