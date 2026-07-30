import React, { useEffect, useMemo, useState } from "react";
import Card, { CardBody, CardHeader } from "../../components/Card";
import Error from "../../components/Error";
import Loader from "../../components/Loader";
import Table from "../../components/Table";
import { getStaffAssignments, getStaffClassStudents } from "../../api/campusflow";

const Students = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");

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
        setError(err?.response?.data?.message || "Failed to load classes");
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
      if (classInfo?._id) {
        map.set(String(classInfo._id), classInfo);
      }
    });
    return Array.from(map.values());
  }, [assignments]);

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
        setStudents(response.students || []);
      } catch (err) {
        setStudentsError(err?.response?.data?.message || "Failed to load students");
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudents();
  }, [selectedClassId]);

  const columns = useMemo(
    () => [
      { header: "USN", render: (row) => <span className="font-mono text-xs text-gray-600">{row.usn}</span> },
      { header: "Student", render: (row) => <span className="font-semibold text-gray-900">{row.userId?.name}</span> },
      { header: "Email", render: (row) => <span className="text-gray-600">{row.userId?.email}</span> },
      { header: "Section", render: (row) => <span className="text-gray-700">{row.section}</span> },
    ],
    []
  );

  if (loading) return <Loader className="min-h-[60vh]" />;
  if (error) return <Error message={error} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Students</h1>
        <p className="mt-2 text-sm text-gray-500">Select a class to view enrolled students.</p>
      </div>


      {!classOptions.length && (
        <Card className="mb-6">
          <CardBody>
            <p className="text-sm font-semibold text-gray-700">No assignments found. Contact admin.</p>
          </CardBody>
        </Card>
      )}

      <Card className="mb-6">
        <CardBody className="flex flex-col gap-2">
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
        </CardBody>
      </Card>

      {studentsError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {studentsError}
        </div>
      )}

      <Card>
        <CardHeader className="border-b border-gray-50 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Class Roster</h2>
        </CardHeader>
        <div className="p-0 overflow-x-auto">
          {studentsLoading ? (
            <div className="p-6">
              <Loader />
            </div>
          ) : (
            <Table columns={columns} data={students} keyField="_id" />
          )}
        </div>
      </Card>
    </div>
  );
};

export default Students;