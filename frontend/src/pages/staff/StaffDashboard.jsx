import React, { useEffect, useMemo, useState } from "react";
import Card, { CardBody, CardHeader } from "../../components/Card";
import AnnouncementCard from "../../components/AnnouncementCard";
import Error from "../../components/Error";
import Loader from "../../components/Loader";
import { getAnnouncements, getStaffAssignments } from "../../api/campusflow";

const StaffDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [assignmentsResponse, announcementsResponse] = await Promise.all([
          getStaffAssignments(),
          getAnnouncements(),
        ]);
        setAssignments(assignmentsResponse.assignments || []);
        setAnnouncements(announcementsResponse.announcements || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load staff dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const classSet = new Set();
    const subjectSet = new Set();
    assignments.forEach((assignment) => {
      if (assignment.classId?._id) classSet.add(String(assignment.classId._id));
      if (assignment.subjectId?._id) subjectSet.add(String(assignment.subjectId._id));
    });
    return {
      classes: classSet.size,
      subjects: subjectSet.size,
    };
  }, [assignments]);

  if (loading) return <Loader className="min-h-[60vh]" />;
  if (error) return <Error message={error} />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Staff Dashboard</h1>
        <p className="mt-2 text-sm text-gray-500">Your assigned classes, subjects, and announcements are ready.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Stat title="Assigned Classes" value={stats.classes} />
        <Stat title="Assigned Subjects" value={stats.subjects} />
      </div>


      {!assignments.length && (
        <Card>
          <CardBody>
            <p className="text-sm font-semibold text-gray-700">No assignments found. Contact admin.</p>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="border-b border-gray-50 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Announcements</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {announcements.length ? (
              announcements.slice(0, 6).map((item) => (
                <AnnouncementCard
                  key={item._id}
                  title={item.title}
                  description={item.description}
                  type={item.type}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500">No announcements right now.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="border-b border-gray-50 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Assignment Coverage</h2>
          </CardHeader>
          <CardBody>
            {assignments.length ? (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div key={assignment._id} className="rounded-lg border border-gray-100 px-3 py-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {assignment.subjectId?.code || "Subject"} - {assignment.subjectId?.name || ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      {assignment.classId?.className ||
                        [assignment.classId?.branch, assignment.classId?.semester, assignment.classId?.section]
                          .filter(Boolean)
                          .join(" ") ||
                        "Class"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No teaching assignments yet.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

const Stat = ({ title, value }) => (
  <Card>
    <CardBody className="p-6">
      <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">{title}</p>
      <p className="mt-2 text-3xl font-black text-gray-900">{value}</p>
    </CardBody>
  </Card>
);

export default StaffDashboard;
