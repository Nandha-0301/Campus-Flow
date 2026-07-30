import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Card, { CardBody, CardHeader } from "../../components/Card";
import FormField from "../../components/FormField";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Loader from "../../components/Loader";
import Error from "../../components/Error";
import Pagination from "../../components/Pagination";
import { createClass, deleteClass, getAdminClassesWithMeta } from "../../api/admin";

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });

  const [form, setForm] = useState({ branch: "", semester: "1", section: "A" });
  const [formErrors, setFormErrors] = useState([]);
  const [formMessage, setFormMessage] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadClasses = async ({ page = pagination.page } = {}) => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminClassesWithMeta({ page, limit: pagination.limit });
      setClasses(response.data?.classes || []);
      setPagination((prev) => ({
        ...prev,
        ...response.meta?.pagination,
        page: response.meta?.pagination?.page || page,
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setFormErrors([]);
    setFormMessage("");
    try {
      setFormLoading(true);
      await createClass({
        branch: form.branch,
        semester: Number(form.semester),
        section: form.section,
      });
      toast.success("Class created successfully");
      setForm({ branch: "", semester: "1", section: "A" });
      await loadClasses();
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to create class";
      const isDuplicate = message.toLowerCase().includes("class already exists");
      setFormErrors(isDuplicate ? [] : err?.response?.data?.errors || []);
      setFormMessage(isDuplicate ? "Class already exists for this branch, semester, and section." : "");
      toast.error(isDuplicate ? "Class already exists" : message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteClass(deleteTarget._id);
      toast.success("Class deleted successfully");
      setDeleteTarget(null);
      await loadClasses({ page: pagination.page });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete class");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      { header: "Class", render: (row) => <span className="font-semibold text-gray-900">{row.className}</span> },
      { header: "Branch", render: (row) => <span className="text-gray-600">{row.branch}</span> },
      { header: "Semester", render: (row) => <span className="text-gray-600">Semester {row.semester}</span> },
      { header: "Section", render: (row) => <span className="text-gray-600">{row.section}</span> },
      {
        header: "Actions",
        render: (row) => (
          <button
            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
            onClick={() => setDeleteTarget(row)}
          >
            Delete
          </button>
        ),
      },
    ],
    []
  );

  if (loading) return <Loader />;
  if (error) return <Error message={error} />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Classes</h1>
        <p className="mt-2 text-sm text-gray-500">Create and manage class groups for academic operations.</p>
      </div>

      <Card className="mb-8">
        <CardHeader className="border-b border-gray-50 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Create Class</h2>
        </CardHeader>
        <CardBody>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={handleCreate}>
            <FormField
              label="Branch"
              value={form.branch}
              onChange={(value) => setForm((prev) => ({ ...prev, branch: value }))}
              required
            />
            <FormField
              label="Semester"
              type="number"
              value={form.semester}
              onChange={(value) => setForm((prev) => ({ ...prev, semester: value }))}
              required
            />
            <FormField
              label="Section"
              value={form.section}
              onChange={(value) => setForm((prev) => ({ ...prev, section: value }))}
              required
            />
            <div className="md:col-span-3">
              <button
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                disabled={formLoading}
              >
                {formLoading ? "Creating..." : "Create Class"}
              </button>
            </div>
            {formErrors.length > 0 && (
              <div className="md:col-span-3 text-xs text-red-600">
                {formErrors.map((errItem) => (
                  <p key={errItem}>{errItem}</p>
                ))}
              </div>
            )}
            {formMessage && (
              <div className="md:col-span-3 text-xs text-red-600">
                {formMessage}
              </div>
            )}
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="border-b border-gray-50 pb-4">
          <h2 className="text-lg font-bold text-gray-900">All Classes</h2>
        </CardHeader>
        <div className="p-0 overflow-x-auto">
          <Table columns={columns} data={classes} keyField="_id" />
        </div>
        <CardBody>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages || 1}
            total={pagination.total}
            limit={pagination.limit}
            label="classes"
            loading={loading}
            onPageChange={(nextPage) => loadClasses({ page: Math.max(1, Math.min(pagination.totalPages || 1, nextPage)) })}
          />
        </CardBody>
      </Card>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Class" size="sm">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              This will delete <span className="font-semibold">{deleteTarget.className}</span>. Deletion is blocked if the class is linked to students, subjects, or timetable slots.
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

export default Classes;
