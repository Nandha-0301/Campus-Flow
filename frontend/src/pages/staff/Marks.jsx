import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import Card, { CardBody, CardHeader } from "../../components/Card";
import Error from "../../components/Error";
import Loader from "../../components/Loader";
import useUnsavedChanges from "../../hooks/useUnsavedChanges";
import { getStaffAssignments, getStaffClassStudents, getStaffMarks, saveMarks } from "../../api/campusflow";

const Marks = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [examType, setExamType] = useState("internal1");
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [totalMap, setTotalMap] = useState({});
  const [initialMarksMap, setInitialMarksMap] = useState({});
  const [initialTotalMap, setInitialTotalMap] = useState({});
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [editMode, setEditMode] = useState(false);
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("name");
  const [activeRowId, setActiveRowId] = useState(null);
  const marksRefs = useRef([]);

  const totalOptions = [20, 25, 50, 100];
  const maxByExam = { internal1: 20, internal2: 20, assignment: 20, final: 40 };

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
  }, [selectedClassId, selectedSubjectId, examType]);

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

        const seedMarks = {};
        const seedTotals = {};
        list.forEach((student) => {
          seedMarks[student._id] = "";
          seedTotals[student._id] = maxByExam[examType];
        });
        setMarksMap(seedMarks);
        setTotalMap(seedTotals);
        setInitialMarksMap(seedMarks);
        setInitialTotalMap(seedTotals);
      } catch (err) {
        setStudentsError(err?.response?.data?.message || "Failed to load students");
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudents();
  }, [selectedClassId, examType]);

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

    if (sortOption === "marks-desc") {
      list = [...list].sort((a, b) => Number(marksMap[b._id] || -1) - Number(marksMap[a._id] || -1));
    } else if (sortOption === "marks-asc") {
      list = [...list].sort((a, b) => Number(marksMap[a._id] || -1) - Number(marksMap[b._id] || -1));
    } else if (sortOption === "name") {
      list = [...list].sort((a, b) => String(a.userId?.name || "").localeCompare(String(b.userId?.name || "")));
    }

    return list;
  }, [students, search, sortOption, marksMap]);

  const validation = useMemo(() => {
    const maxAllowed = maxByExam[examType];
    let invalidMarks = 0;
    let invalidTotals = 0;
    students.forEach((student) => {
      const rawMarks = marksMap[student._id];
      const marksValue = Number(rawMarks);
      const totalValue = Number(totalMap[student._id]);
      if (!Number.isFinite(totalValue) || !totalOptions.includes(totalValue)) invalidTotals += 1;
      if (totalValue > maxAllowed) invalidTotals += 1;
      if (rawMarks === "" || rawMarks === undefined || rawMarks === null) {
        invalidMarks += 1;
        return;
      }
      if (!Number.isFinite(marksValue) || marksValue < 0 || marksValue > totalValue) invalidMarks += 1;
    });
    return { invalidMarks, invalidTotals, maxAllowed };
  }, [students, marksMap, totalMap, examType]);

  const missingCount = useMemo(
    () => students.filter((student) => marksMap[student._id] === "" || marksMap[student._id] === undefined).length,
    [students, marksMap]
  );

  const marksStats = useMemo(() => {
    const values = students
      .map((student) => {
        const raw = marksMap[student._id];
        const totalValue = Number(totalMap[student._id]);
        const value = Number(raw);
        if (!Number.isFinite(value) || value < 0 || value > totalValue) return null;
        return value;
      })
      .filter((value) => value !== null);

    if (!values.length) {
      return { average: 0, highest: 0, lowest: 0 };
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    const average = Number((total / values.length).toFixed(2));
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    return { average, highest, lowest };
  }, [students, marksMap, totalMap]);

  const hasUnsavedChanges = useMemo(() => {
    if (!students.length) return false;
    return students.some((student) => {
      const id = student._id;
      return marksMap[id] !== initialMarksMap[id] || totalMap[id] !== initialTotalMap[id];
    });
  }, [students, marksMap, totalMap, initialMarksMap, initialTotalMap]);

  useUnsavedChanges(hasUnsavedChanges);

  useEffect(() => {
    if (saveStatus === "saved" || saveStatus === "error") {
      const timer = setTimeout(() => setSaveStatus("idle"), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [saveStatus]);

  const loadPreviousMarks = async () => {
    if (!selectedClassId || !selectedSubjectId) {
      toast.error("Select class and subject first");
      return;
    }

    try {
      const response = await getStaffMarks({
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        examType,
      });
      console.log("API:", response);
      const list = response.marks || [];
      const seedMarks = {};
      const seedTotals = {};
      list.forEach((row) => {
        const valueMap = {
          internal1: row.internal1,
          internal2: row.internal2,
          assignment: row.assignment,
          final: row.external,
        };
        seedMarks[row.studentId] = valueMap[examType] ?? "";
        seedTotals[row.studentId] = maxByExam[examType];
      });

      students.forEach((student) => {
        if (seedMarks[student._id] === undefined) seedMarks[student._id] = "";
        if (seedTotals[student._id] === undefined) seedTotals[student._id] = maxByExam[examType];
      });

      setMarksMap(seedMarks);
      setTotalMap(seedTotals);
      setInitialMarksMap(seedMarks);
      setInitialTotalMap(seedTotals);
      setEditMode(Boolean(list.length));
      setSaveStatus("idle");
      toast.success("Loaded previous marks");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load marks");
    }
  };

  const resetMarks = () => {
    setMarksMap(initialMarksMap);
    setTotalMap(initialTotalMap);
  };

  const handleMarksKeyDown = (event, index) => {
    if (event.key === "ArrowDown" || event.key === "Enter") {
      event.preventDefault();
      marksRefs.current[index + 1]?.focus();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      marksRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    if (!selectedClassId || !selectedSubjectId) {
      toast.error("Select class and subject first");
      return;
    }

    if (missingCount > 0) {
      toast.error(`Missing entries for ${missingCount} students`);
      return;
    }

    if (validation.invalidMarks || validation.invalidTotals) {
      toast.error("Fix invalid entries before saving");
      return;
    }

    try {
      setSaving(true);
      setSaveStatus("saving");
      const entries = students.map((student) => ({
        studentId: student._id,
        marks: marksMap[student._id],
      }));

      const response = await saveMarks({
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        examType,
        allowUpdate: editMode,
        entries,
      });

      setInitialMarksMap({ ...marksMap });
      setInitialTotalMap({ ...totalMap });
      setEditMode(false);
      setSaveStatus("saved");
      const queued = response?.notificationsQueued || 0;
      toast.success(
        queued > 0
          ? `Marks saved. Notifications queued for ${queued} students`
          : "Marks saved"
      );
    } catch (err) {
      setSaveStatus("error");
      toast.error(err?.response?.data?.message || "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader className="min-h-[60vh]" />;
  if (error) return <Error message={error} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Marks Entry</h1>
        <p className="mt-2 text-sm text-gray-500">Select class, subject, and exam type to enter marks.</p>
        <p className="mt-1 text-xs text-gray-400">Max allowed for {examType} is {validation.maxAllowed}.</p>
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
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Exam Type</label>
            <select
              className="rounded-xl border border-gray-200 px-3 py-2"
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
            >
              <option value="internal1">Internal 1</option>
              <option value="internal2">Internal 2</option>
              <option value="assignment">Assignment</option>
              <option value="final">Final</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              onClick={handleSubmit}
              disabled={
                saving ||
                !students.length ||
                !selectedSubjectId ||
                !selectedClassId ||
                validation.invalidMarks ||
                validation.invalidTotals ||
                missingCount > 0
              }
            >
              {saving ? "Saving..." : "Save Marks"}
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
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Average</p>
            <p className="mt-2 text-2xl font-bold text-indigo-600">{marksStats.average}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Highest</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{marksStats.highest}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lowest</p>
            <p className="mt-2 text-2xl font-bold text-rose-500">{marksStats.lowest}</p>
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
            <select
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="marks-desc">Sort by Marks (High ? Low)</option>
              <option value="marks-asc">Sort by Marks (Low ? High)</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"
              onClick={resetMarks}
              disabled={!students.length}
            >
              Reset
            </button>
            <button
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
              onClick={loadPreviousMarks}
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

      {(validation.invalidMarks > 0 || validation.invalidTotals > 0) && (
        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Fix invalid entries before saving. Marks must be within total, and totals cannot exceed allowed max.
        </div>
      )}

      {studentsError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {studentsError}
        </div>
      )}

      <Card>
        <CardHeader className="border-b border-gray-50 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Marks Table</h2>
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
                    <th className="px-6 py-3">Student ID</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Marks</th>
                    <th className="px-6 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((student, index) => {
                    const value = marksMap[student._id];
                    const totalValue = totalMap[student._id] ?? maxByExam[examType];
                    const numericValue = Number(value);
                    const isValid =
                      value !== "" && Number.isFinite(numericValue) && numericValue >= 0 && numericValue <= totalValue;
                    const isOverMax = Number(totalValue) > maxByExam[examType];
                    const border = value === "" ? "border-amber-300" : isValid ? "border-emerald-400" : "border-red-400";
                    const totalBorder = isOverMax ? "border-red-400" : "border-emerald-400";
                    const isTop = isValid && numericValue === marksStats.highest && marksStats.highest !== marksStats.lowest;
                    const isLow = isValid && numericValue === marksStats.lowest && marksStats.highest !== marksStats.lowest;
                    const rowHighlight = isTop ? "bg-emerald-50" : isLow ? "bg-rose-50" : "";
                    const isActive = activeRowId === student._id;
                    return (
                      <tr
                        key={student._id}
                        className={`transition-colors ${rowHighlight} ${isActive ? "bg-indigo-50" : "hover:bg-indigo-50/50"}`}
                        onMouseEnter={() => setActiveRowId(student._id)}
                      >
                        <td className="px-6 py-3">
                          <span className="font-mono text-xs text-gray-600">{student.usn}</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="font-semibold text-gray-900">{student.userId?.name}</span>
                        </td>
                        <td className="px-6 py-3">
                          <input
                            ref={(el) => {
                              marksRefs.current[index] = el;
                            }}
                            type="number"
                            min="0"
                            max={totalValue}
                            className={`w-24 rounded border px-2 py-1 text-sm ${border}`}
                            value={value}
                            onChange={(e) =>
                              setMarksMap((prev) => ({
                                ...prev,
                                [student._id]: e.target.value,
                              }))
                            }
                            onFocus={() => setActiveRowId(student._id)}
                            onKeyDown={(event) => handleMarksKeyDown(event, index)}
                          />
                        </td>
                        <td className="px-6 py-3">
                          <select
                            className={`w-24 rounded border px-2 py-1 text-sm ${totalBorder}`}
                            value={totalValue}
                            onChange={(e) =>
                              setTotalMap((prev) => ({
                                ...prev,
                                [student._id]: Number(e.target.value),
                              }))
                            }
                            onFocus={() => setActiveRowId(student._id)}
                          >
                            {totalOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
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

export default Marks;
