import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Card, { CardBody, CardHeader } from "../../components/Card";
import AnnouncementCard from "../../components/AnnouncementCard";
import Error from "../../components/Error";
import Loader from "../../components/Loader";
import AnnouncementForm from "../../components/AnnouncementForm";
import { createStaffAnnouncement, getAnnouncements, getStaffAssignments } from "../../api/campusflow";

const typeOptions = ["HOLIDAY", "EXAM", "INTERNAL", "EVENT", "GENERAL"];
const targetOptions = ["STUDENTS", "PARENTS"];

const Announcements = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "GENERAL",
    target: "STUDENTS",
    classId: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [announcementsResponse, assignmentsResponse] = await Promise.all([
        getAnnouncements(),
        getStaffAssignments(),
      ]);
      console.log("API:", announcementsResponse);
      console.log("API:", assignmentsResponse);
      setAnnouncements(announcementsResponse.announcements || []);
      setAssignments(assignmentsResponse.assignments || []);

      const firstClassId = assignmentsResponse.assignments?.find((item) => item.classId?._id)?.classId?._id || "";
      setForm((prev) => ({ ...prev, classId: prev.classId || firstClassId }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.classId) {
      toast.error("Select a class for this announcement");
      return;
    }

    try {
      setSaving(true);
      await createStaffAnnouncement({
        title: form.title,
        description: form.description,
        type: form.type,
        target: form.target,
        classId: form.classId,
        isActive: form.isActive,
      });
      toast.success("Announcement created");
      setForm((prev) => ({ ...prev, title: "", description: "" }));
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create announcement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader className="min-h-[60vh]" />;
  if (error) return <Error message={error} />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Announcements</h1>
        <p className="mt-2 text-sm text-gray-500">Create and manage structured announcements across roles and classes.</p>
      </div>

      {!classOptions.length && (
        <Card className="mb-8">
          <CardBody>
            <p className="text-sm font-semibold text-gray-700">No assignments found. Contact admin.</p>
          </CardBody>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader className="border-b border-gray-50 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Create Announcement</h2>
        </CardHeader>
        <CardBody>
          <AnnouncementForm
            value={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            submitting={saving}
            submitLabel="Create Announcement"
            submittingLabel="Creating..."
            classes={classOptions}
            typeOptions={typeOptions}
            targetOptions={targetOptions}
            showClass
            requireClass
            classLabel="Class (required)"
            optionalClassLabel="Select class"
            disableSubmit={!classOptions.length}
            emptyClassLabel="No classes assigned"
          />
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader className="border-b border-gray-50 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {announcements.length === 0 && (
              <p className="text-sm text-gray-500">No announcements yet.</p>
            )}
            {announcements.map((item) => (
              <div key={item._id} className="rounded-xl border border-gray-100 p-4">
                <AnnouncementCard
                  title={item.title}
                  description={item.description}
                  type={item.type}
                />
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span>Target: {item.target}</span>
                  {item.classId ? (
                    <span>Class: {item.classId?.className || ""}</span>
                  ) : (
                    <span>Class: All</span>
                  )}
                  <span>Status: {item.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default Announcements;
