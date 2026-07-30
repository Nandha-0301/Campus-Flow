import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Card, { CardBody, CardHeader } from "../../components/Card";
import FormField from "../../components/FormField";
import FormSelect from "../../components/FormSelect";
import Modal from "../../components/Modal";
import Loader from "../../components/Loader";
import Error from "../../components/Error";
import AnnouncementCard from "../../components/AnnouncementCard";
import AnnouncementForm from "../../components/AnnouncementForm";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAdminAnnouncements,
  getAdminClasses,
  updateAnnouncement,
} from "../../api/admin";

const typeOptions = ["HOLIDAY", "EXAM", "INTERNAL", "EVENT", "GENERAL"];
const targetOptions = ["STUDENTS", "PARENTS"];

const Announcements = () => {
  const [loading, setLoading] = useState(true);
  const [classesLoading, setClassesLoading] = useState(true);
  const [error, setError] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "GENERAL",
    target: "STUDENTS",
    classId: "",
    isActive: true,
  });
  const [creating, setCreating] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    type: "GENERAL",
    target: "STUDENTS",
    classId: "",
    isActive: true,
  });
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadClasses = async () => {
    try {
      setClassesLoading(true);
      const response = await getAdminClasses();
      setClasses(response.classes || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load classes");
    } finally {
      setClassesLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminAnnouncements();
      setAnnouncements(response.announcements || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  if (loading || classesLoading) return <Loader />;
  if (error) return <Error message={error} />;

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      setCreating(true);
      await createAnnouncement({
        title: form.title,
        description: form.description,
        type: form.type,
        target: form.target,
        classId: form.classId || null,
        isActive: form.isActive,
      });
      toast.success("Announcement created");
      setForm({
        title: "",
        description: "",
        type: "GENERAL",
        target: "STUDENTS",
        classId: "",
        isActive: true,
      });
      await loadAnnouncements();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create announcement");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setEditForm({
      title: item.title || "",
      description: item.description || "",
      type: item.type || "GENERAL",
      target: item.target || "STUDENTS",
      classId: item.classId?._id || "",
      isActive: item.isActive !== false,
    });
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    if (!editTarget) return;
    try {
      setEditLoading(true);
      await updateAnnouncement(editTarget._id, {
        title: editForm.title,
        description: editForm.description,
        type: editForm.type,
        target: editForm.target,
        classId: editForm.classId || null,
        isActive: editForm.isActive,
      });
      toast.success("Announcement updated");
      setEditTarget(null);
      await loadAnnouncements();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update announcement");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteAnnouncement(deleteTarget._id);
      toast.success("Announcement deleted");
      setDeleteTarget(null);
      await loadAnnouncements();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete announcement");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Announcements</h1>
        <p className="mt-2 text-sm text-gray-500">Create and manage structured announcements across roles and classes.</p>
      </div>

      <Card className="mb-8">
        <CardHeader className="border-b border-gray-50 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Create Announcement</h2>
        </CardHeader>
        <CardBody>
          <AnnouncementForm
            value={form}
            onChange={setForm}
            onSubmit={handleCreate}
            submitting={creating}
            classes={classes}
            typeOptions={typeOptions}
            targetOptions={targetOptions}
            showClass
            requireClass={false}
            classLabel="Class (optional)"
            optionalClassLabel="All classes"
            submitLabel="Create Announcement"
            submittingLabel="Creating..."
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
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    onClick={() => openEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteTarget(item)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Announcement" size="sm">
        {editTarget && (
          <form className="space-y-3" onSubmit={handleEdit}>
            <FormField label="Title" value={editForm.title} onChange={(v) => setEditForm((p) => ({ ...p, title: v }))} required />
            <FormField label="Description" value={editForm.description} onChange={(v) => setEditForm((p) => ({ ...p, description: v }))} required />
            <FormSelect label="Type" value={editForm.type} onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))}>
              {typeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </FormSelect>
            <FormSelect label="Target" value={editForm.target} onChange={(e) => setEditForm((p) => ({ ...p, target: e.target.value }))}>
              {targetOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </FormSelect>
            <FormSelect label="Class (optional)" value={editForm.classId} onChange={(e) => setEditForm((p) => ({ ...p, classId: e.target.value }))}>
              <option value="">All classes</option>
              {classes.map((item) => (
                <option key={item._id} value={item._id}>{item.className}</option>
              ))}
            </FormSelect>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Active
            </label>
            <button className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60" disabled={editLoading}>
              {editLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Announcement" size="sm">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Delete <span className="font-semibold">{deleteTarget.title}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Announcements;
