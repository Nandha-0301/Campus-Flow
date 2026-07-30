import React, { useEffect, useMemo, useState } from "react";
import Card, { CardBody, CardHeader } from "../../components/Card";
import Error from "../../components/Error";
import Loader from "../../components/Loader";
import { getStaffAssignments } from "../../api/campusflow";

const MyClasses = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getStaffAssignments();
        console.log("API:", response);
        setAssignments(response.assignments || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load classes");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const classGroups = useMemo(() => {
    const map = new Map();
    assignments.forEach((assignment) => {
      const classInfo = assignment.classId;
      const subjectInfo = assignment.subjectId;
      if (!classInfo?._id) return;
      const key = String(classInfo._id);
      if (!map.has(key)) {
        map.set(key, {
          classInfo,
          subjects: [],
        });
      }
      if (subjectInfo?._id) {
        const group = map.get(key);
        group.subjects.push(subjectInfo);
      }
    });
    return Array.from(map.values());
  }, [assignments]);

  if (loading) return <Loader className="min-h-[60vh]" />;
  if (error) return <Error message={error} />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Classes</h1>
        <p className="mt-2 text-sm text-gray-500">Classes and subjects assigned to you.</p>
      </div>

      {classGroups.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {classGroups.map((group) => (
            <Card key={group.classInfo._id}>
              <CardHeader className="border-b border-gray-50 pb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {group.classInfo.className ||
                    [group.classInfo.branch, group.classInfo.semester, group.classInfo.section]
                      .filter(Boolean)
                      .join(" ")}
                </h2>
              </CardHeader>
              <CardBody className="space-y-2">
                {group.subjects.length ? (
                  group.subjects.map((subject) => (
                    <div key={subject._id} className="rounded-lg border border-gray-100 px-3 py-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {subject.code} - {subject.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {subject.branch} | Semester {subject.semester}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No subjects assigned yet.</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">No assignments found. Contact admin.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default MyClasses;