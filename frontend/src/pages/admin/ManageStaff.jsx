import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Card, { CardBody, CardHeader } from "../../components/Card";
import FormField from "../../components/FormField";
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Error from "../../components/Error";
import { createStaff, deleteStaff, getAdminStaff } from "../../api/admin";

const ManageStaff = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", department: "" });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminStaff();
      setStaff(response.staff || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load staff list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const department = form.department.trim();

    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }

    try {
      setCreating(true);
      await createStaff({
        name,
        email,
        department: department || undefined,
      });
      toast.success("Staff created successfully");
      setForm({ name: "", email: "", department: "" });
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create staff");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (staffId) => {
    if (!staffId) return;
    try {
      setDeletingId(staffId);
      await deleteStaff(staffId);
      toast.success("Staff deleted successfully");
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete staff");
    } finally {
      setDeletingId("");
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Name",
        render: (row) => <span className="font-semibold text-gray-900">{row.userId?.name || "-"}</span>,
      },
      {
        header: "Email",
        render: (row) => <span className="text-gray-600">{row.userId?.email || "-"}</span>,
      },
      {
        header: "Department",
        render: (row) => <span className="text-gray-600">{row.department || "-"}</span>,
      },
      {
        header: "Actions",
        render: (row) => (
          <button
            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            onClick={() => handleDelete(row._id)}
            disabled={!row._id || deletingId === row._id}
          >
            {deletingId === row._id ? "Deleting..." : "Delete"}
          </button>
        ),
      },
    ],
    [deletingId]
  );

  if (loading) return <Loader />;
  if (error) return <Error message={error} />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Staff Management</h1>
        <p className="mt-2 text-sm text-gray-500">Create and manage staff accounts only.</p>
      </div>

      <Card className="mb-6">
        <CardHeader className="border-b border-gray-50 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Create Staff</h2>
        </CardHeader>
        <CardBody>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={handleCreate}>
            <FormField label="Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} required />
            <FormField label="Email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} required />
            <FormField label="Department (optional)" value={form.department} onChange={(v) => setForm((p) => ({ ...p, department: v }))} />
            <div className="md:col-span-3">
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60" disabled={creating}>
                {creating ? "Creating..." : "Create Staff"}
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="border-b border-gray-50 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Staff</h2>
        </CardHeader>
        <div className="p-0 overflow-x-auto">
          <Table columns={columns} data={staff} keyField="_id" />
        </div>
      </Card>
    </div>
  );
};

export default ManageStaff;
