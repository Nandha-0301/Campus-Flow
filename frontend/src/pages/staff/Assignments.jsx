import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import Card, { CardBody, CardHeader } from "../../components/Card";
import Error from "../../components/Error";
import Loader from "../../components/Loader";
import useUnsavedChanges from "../../hooks/useUnsavedChanges";
import {
  createAcademicAssignment,
  deleteAcademicAssignment,
  getAcademicAssignmentSubmissions,
  getAcademicAssignments,
  getStaffAssignments,
  saveAcademicAssignmentMarks,
  updateAcademicAssignment,
} from "../../api/campusflow";

const assignmentTypes = ["WRITING", "SEMINAR", "PROJECT", "PRESENTATION"];

const Assignments = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teachingAssignments, setTeachingAssignments] = useState([]);
  const [academicAssignments, setAcademicAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("WRITING");
  const [formClassId, setFormClassId] = useState("");
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formMaxMarks, setFormMaxMarks] = useState(20);
  const [formDeadline, setFormDeadline] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [editingId, setEditingId] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [initialMarksMap, setInitialMarksMap] = useState({});
  const [initialStatusMap, setInitialStatusMap] = useState({});
  const [markingLoading, setMarkingLoading] = useState(false);
  const [markingError, setMarkingError] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [editMode, setEditMode] = useState(false);
  const [search, setSearch] = useState("");
  const [activeRowId, setActiveRowId] = useState(null);
  const marksRefs = useRef([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [teachingResponse, academicResponse] = await Promise.all([
          getStaffAssignments(),
          getAcademicAssignments(),
        ]);
        console.log("API:", teachingResponse);
        console.log("API:", academicResponse);
        setTeachingAssignments(teachingResponse.assignments || []);
        setAcademicAssignments(academicResponse.assignments || []);
        const firstAssignmentId = academicResponse.assignments?.[0]?._id || "";
        setSelectedAssignmentId((prev) => prev || firstAssignmentId);
        const firstClassId = teachingResponse.assignments?.find((item) => item.classId?._id)?.classId?._id || "";
        setFormClassId((prev) => prev || firstClassId);
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
    teachingAssignments.forEach((assignment) => {
      const classInfo = assignment.classId;
      if (classInfo?._id) map.set(String(classInfo._id), classInfo);
    });
    return Array.from(map.values());
  }, [teachingAssignments]);

  const subjectOptions = useMemo(() => {
    if (!formClassId) return [];
    const map = new Map();
    teachingAssignments.forEach((assignment) => {
      if (String(assignment.classId?._id) !== String(formClassId)) return;
      const subjectInfo = assignment.subjectId;
      if (subjectInfo?._id) map.set(String(subjectInfo._id), subjectInfo);
    });
    return Array.from(map.values());
  }, [teachingAssignments, formClassId]);

  useEffect(() => {
    const firstSubjectId = subjectOptions[0]?._id || "";
    setFormSubjectId((prev) =>
      subjectOptions.some((subject) => String(subject._id) === String(prev)) ? prev : firstSubjectId
    );
  }, [subjectOptions]);

  const filteredAssignments = useMemo(() => {
    return academicAssignments.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [academicAssignments]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) => {
      const name = student.userId?.name?.toLowerCase() || "";
      const usn = student.usn?.toLowerCase() || "";
      return name.includes(query) || usn.includes(query);
    });
  }, [students, search]);

  const marksStats = useMemo(() => {
    const values = students
      .map((student) => {
        const raw = marksMap[student._id];
        const value = Number(raw);
        if (!Number.isFinite(value) || value < 0 || value > Number(selectedAssignment?.maxMarks || 0)) return null;
        return value;
      })
      .filter((value) => value !== null);

    if (!values.length) return { average: 0, highest: 0, lowest: 0 };
    const total = values.reduce((sum, value) => sum + value, 0);
    return {
      average: Number((total / values.length).toFixed(2)),
      highest: Math.max(...values),
      lowest: Math.min(...values),
    };
  }, [students, marksMap, selectedAssignment]);

  const missingCount = useMemo(
    () => students.filter((student) => marksMap[student._id] === "" || marksMap[student._id] === undefined).length,
    [students, marksMap]
  );

  const invalidCount = useMemo(() => {
    const maxMarks = Number(selectedAssignment?.maxMarks || 0);
    return students.filter((student) => {
      const raw = marksMap[student._id];
      if (raw === "" || raw === undefined) return false;
      const value = Number(raw);
      return !Number.isFinite(value) || value < 0 || value > maxMarks;
    }).length;
  }, [students, marksMap, selectedAssignment]);

  const hasUnsavedChanges = useMemo(() => {
    if (!students.length) return false;
    return students.some((student) => {
      const id = student._id;
      return marksMap[id] !== initialMarksMap[id] || statusMap[id] !== initialStatusMap[id];
    });
  }, [students, marksMap, statusMap, initialMarksMap, initialStatusMap]);

  useUnsavedChanges(hasUnsavedChanges);

  useEffect(() => {
    if (saveStatus === "saved" || saveStatus === "error") {
      const timer = setTimeout(() => setSaveStatus("idle"), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [saveStatus]);

  const resetForm = () => {
    setFormTitle("");
    setFormType("WRITING");
    setFormMaxMarks(20);
    setFormDeadline("");
    setFormDescription("");
    setEditingId("");
  };

  const handleEdit = (assignment) => {
    setEditingId(assignment._id);
    setFormTitle(assignment.title || "");
    setFormType(assignment.type || "WRITING");
    setFormClassId(assignment.classId?._id || "");
    setFormSubjectId(assignment.subjectId?._id || "");
    setFormMaxMarks(Number(assignment.maxMarks || 20));
    setFormDeadline(assignment.deadline ? new Date(assignment.deadline).toISOString().slice(0, 10) : "");
    setFormDescription(assignment.description || "");
  };

  const handleDelete = async (assignment) => {
    const confirmed = window.confirm("Delete this assignment?");
    if (!confirmed) return;

    try {
      await deleteAcademicAssignment(assignment._id);
      setAcademicAssignments((prev) => prev.filter((item) => item._id !== assignment._id));
      if (selectedAssignmentId === assignment._id) {
        setSelectedAssignmentId("");
        setSelectedAssignment(null);
        setStudents([]);
      }
      toast.success("Assignment deleted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete assignment");
    }
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formClassId || !formSubjectId) {
      toast.error("Select class and subject");
      return;
    }
    if (!formMaxMarks || Number(formMaxMarks) <= 0) {
      toast.error("Max marks must be greater than 0");
      return;
    }
    if (formDeadline) {
      const today = new Date().toISOString().slice(0, 10);
      if (formDeadline < today) {
        toast.error("Deadline must be today or in the future");
        return;
      }
    }

    try {
      setFormSaving(true);
      const payload = {
        title: formTitle,
        type: formType,
        classId: formClassId,
        subjectId: formSubjectId,
        maxMarks: Number(formMaxMarks),
        deadline: formDeadline || null,
        description: formDescription,
      };

      if (editingId) {
        const response = await updateAcademicAssignment(editingId, payload);
        setAcademicAssignments((prev) =>
          prev.map((item) => (item._id === response.assignment?._id ? response.assignment : item))
        );
        toast.success("Assignment updated");
      } else {
        const response = await createAcademicAssignment(payload);
        setAcademicAssignments((prev) => [response.assignment, ...prev]);
        setSelectedAssignmentId(response.assignment?._id || "");
        toast.success("Assignment created");
      }

      resetForm();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save assignment");
    } finally {
      setFormSaving(false);
    }
  };

  const loadSubmissions = async (assignmentId) => {
    if (!assignmentId) return;
    try {
      setMarkingLoading(true);
      setMarkingError("");
      const response = await getAcademicAssignmentSubmissions(assignmentId);
      console.log("API:", response);
      const assignment = response.assignment || null;
      const list = response.students || [];
      const submissions = response.submissions || [];
      const submissionMap = new Map(submissions.map((item) => [String(item.studentId), item]));

      const seedMarks = {};
      const seedStatus = {};
      list.forEach((student) => {
        const row = submissionMap.get(String(student._id));
        seedMarks[student._id] = row?.marks ?? "";
        seedStatus[student._id] = row?.status || "submitted";
      });

      setStudents(list);
      setSelectedAssignment(assignment);
      setMarksMap(seedMarks);
      setStatusMap(seedStatus);
      setInitialMarksMap(seedMarks);
      setInitialStatusMap(seedStatus);
      setEditMode(Boolean(submissions.length));
      setSaveStatus("idle");
    } catch (err) {
      setMarkingError(err?.response?.data?.message || "Failed to load assignment marks");
    } finally {
      setMarkingLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAssignmentId) {
      loadSubmissions(selectedAssignmentId);
    }
  }, [selectedAssignmentId]);

  const handleSaveMarks = async () => {
    if (!selectedAssignmentId) {
      toast.error("Select an assignment to mark");
      return;
    }
    if (missingCount > 0) {
      toast.error(`Missing entries for ${missingCount} students`);
      return;
    }
    if (invalidCount > 0) {
      toast.error("Fix invalid marks before saving");
      return;
    }

    try {
      setSaveStatus("saving");
      const entries = students.map((student) => ({
        studentId: student._id,
        marks: marksMap[student._id],
        status: statusMap[student._id] || "submitted",
      }));

      await saveAcademicAssignmentMarks(selectedAssignmentId, { entries });
      setInitialMarksMap({ ...marksMap });
      setInitialStatusMap({ ...statusMap });
      setEditMode(false);
      setSaveStatus("saved");
      toast.success("Assignment marks saved");
    } catch (err) {
      setSaveStatus("error");
      toast.error(err?.response?.data?.message || "Failed to save marks");
    }
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

  if (loading) return <Loader className="min-h-[60vh]" />;
  if (error) return <Error message={error} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Academic Assignments</h1>
        <p className="mt-2 text-sm text-gray-500">Create, manage, and grade your assignments.</p>
      </div>

      {!classOptions.length && (
        <Card className="mb-6">
          <CardBody>
            <p className="text-sm font-semibold text-gray-700">No assignments found. Contact admin.</p>
          </CardBody>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-bold text-gray-900">Create Assignment</h2>
        </CardHeader>
        <CardBody className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Title</label>
            <input
              className="rounded-xl border border-gray-200 px-3 py-2"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Assignment title"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Type</label>
            <select className="rounded-xl border border-gray-200 px-3 py-2" value={formType} onChange={(e) => setFormType(e.target.value)}>
              {assignmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Class</label>
            <select
              className="rounded-xl border border-gray-200 px-3 py-2"
              value={formClassId}
              onChange={(e) => setFormClassId(e.target.value)}
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
              value={formSubjectId}
              onChange={(e) => setFormSubjectId(e.target.value)}
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
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Max Marks</label>
            <input
              type="number"
              min="1"
              className="rounded-xl border border-gray-200 px-3 py-2"
              value={formMaxMarks}
              onChange={(e) => setFormMaxMarks(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Deadline (optional)</label>
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              className="rounded-xl border border-gray-200 px-3 py-2"
              value={formDeadline}
              onChange={(e) => setFormDeadline(e.target.value)}
            />
          </div>
          <div className="md:col-span-3 flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Description</label>
            <textarea
              className="rounded-xl border border-gray-200 px-3 py-2"
              rows="3"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="md:col-span-3 flex items-center gap-3">
            <button
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              onClick={handleSubmit}
              disabled={formSaving}
            >
              {formSaving ? "Saving..." : editingId ? "Update Assignment" : "Create Assignment"}
            </button>
            {editingId && (
              <button
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-bold text-gray-900">Assignments</h2>
        </CardHeader>
        <div className="p-0">
          {!filteredAssignments.length ? (
            <div className="p-6 text-sm text-gray-500">No assignments created yet.</div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto">
              <table className="min-w-full text-left">
                <thead className="sticky top-0 z-10 bg-white text-xs uppercase tracking-wider text-gray-500">
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Subject</th>
                    <th className="px-6 py-3">Class</th>
                    <th className="px-6 py-3">Assigned On</th>
                    <th className="px-6 py-3">Deadline</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAssignments.map((assignment) => {
                    const deadline = assignment.deadline ? new Date(assignment.deadline) : null;
                    const isClosed = deadline ? deadline < new Date() : false;
                    const assignedOn = assignment.createdAt ? new Date(assignment.createdAt) : null;
                    const isActive = selectedAssignmentId === assignment._id;
                    return (
                      <tr key={assignment._id} className={`transition-colors ${isActive ? "bg-indigo-50" : "hover:bg-indigo-50/50"}`}>
                        <td className="px-6 py-3">
                          <p className="font-semibold text-gray-900">{assignment.title}</p>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">{assignment.type}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {assignment.subjectId?.code ? `${assignment.subjectId.code} - ${assignment.subjectId.name}` : assignment.subjectId?.name}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {assignment.classId?.className ||
                            [assignment.classId?.branch, assignment.classId?.semester, assignment.classId?.section]
                              .filter(Boolean)
                              .join(" ")}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {assignedOn ? assignedOn.toLocaleDateString() : "—"}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {deadline ? deadline.toLocaleDateString() : "—"}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isClosed ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {isClosed ? "Closed" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700"
                              onClick={() => setSelectedAssignmentId(assignment._id)}
                            >
                              Mark
                            </button>
                            <button
                              className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"
                              onClick={() => handleEdit(assignment)}
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                              onClick={() => handleDelete(assignment)}
                            >
                              Delete
                            </button>
                          </div>
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

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Assignment Marking</h2>
              <p className="text-sm text-gray-500">Select an assignment to enter marks.</p>
            </div>
            {selectedAssignment && (
              <div className="text-xs font-semibold text-gray-500">
                Max marks: {selectedAssignment.maxMarks}
              </div>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {!selectedAssignmentId && <div className="text-sm text-gray-500">Select an assignment to begin.</div>}
          {markingError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {markingError}
            </div>
          )}
          {editMode && (
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Editing previous data
            </div>
          )}

          {selectedAssignmentId && (
            <>
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

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Search student"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <button
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    onClick={handleSaveMarks}
                    disabled={
                      markingLoading ||
                      !students.length ||
                      missingCount > 0 ||
                      invalidCount > 0
                    }
                  >
                    Save Marks
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
              </div>

              {missingCount > 0 && (
                <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                  Missing entries for {missingCount} students
                </div>
              )}
              {invalidCount > 0 && (
                <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                  Fix invalid marks before saving
                </div>
              )}

              {markingLoading ? (
                <Loader />
              ) : students.length === 0 ? (
                <div className="text-sm text-gray-500">No students assigned to this class</div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto">
                  <table className="min-w-full text-left">
                    <thead className="sticky top-0 z-10 bg-white text-xs uppercase tracking-wider text-gray-500">
                      <tr className="border-b border-gray-100">
                        <th className="px-6 py-3">Student</th>
                        <th className="px-6 py-3">Marks</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStudents.map((student, index) => {
                        const raw = marksMap[student._id];
                        const value = Number(raw);
                        const maxMarks = Number(selectedAssignment?.maxMarks || 0);
                        const isValid =
                          raw !== "" && Number.isFinite(value) && value >= 0 && value <= maxMarks;
                        const border = raw === "" ? "border-amber-300" : isValid ? "border-emerald-400" : "border-red-400";
                        const isTop = isValid && value === marksStats.highest && marksStats.highest !== marksStats.lowest;
                        const isLow = isValid && value === marksStats.lowest && marksStats.highest !== marksStats.lowest;
                        const rowHighlight = isTop ? "bg-emerald-50" : isLow ? "bg-rose-50" : "";
                        const isActive = activeRowId === student._id;
                        return (
                          <tr
                            key={student._id}
                            className={`transition-colors ${rowHighlight} ${isActive ? "bg-indigo-50" : "hover:bg-indigo-50/50"}`}
                            onMouseEnter={() => setActiveRowId(student._id)}
                          >
                            <td className="px-6 py-3">
                              <div className="font-semibold text-gray-900">{student.userId?.name}</div>
                              <div className="text-xs text-gray-500">{student.usn}</div>
                            </td>
                            <td className="px-6 py-3">
                              <input
                                ref={(el) => {
                                  marksRefs.current[index] = el;
                                }}
                                type="number"
                                min="0"
                                max={maxMarks}
                                className={`w-24 rounded border px-2 py-1 text-sm ${border}`}
                                value={raw}
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
                                className="rounded border border-gray-200 px-2 py-1 text-sm"
                                value={statusMap[student._id] || "submitted"}
                                onChange={(e) =>
                                  setStatusMap((prev) => ({
                                    ...prev,
                                    [student._id]: e.target.value,
                                  }))
                                }
                                onFocus={() => setActiveRowId(student._id)}
                              >
                                <option value="submitted">Submitted</option>
                                <option value="pending">Pending</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default Assignments;
