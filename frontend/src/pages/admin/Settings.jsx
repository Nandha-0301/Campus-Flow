import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Card, { CardBody, CardHeader } from "../../components/Card";
import FormField from "../../components/FormField";
import FormSelect from "../../components/FormSelect";
import Loader from "../../components/Loader";
import Error from "../../components/Error";
import { getAdminSettings, updateAdminSettings } from "../../api/admin";
import { useSettings } from "../../context/SettingsContext";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState([]);
  const [form, setForm] = useState({
    systemName: "",
    academicYear: "",
    allowRegistration: true,
    defaultRole: "student",
  });
  const { refresh: refreshSettings } = useSettings();

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminSettings();
      const settings = response?.settings || {};
      setForm({
        systemName: settings.systemName || "CampusFlow",
        academicYear: settings.academicYear || "",
        allowRegistration: settings.allowRegistration ?? true,
        defaultRole: settings.defaultRole || "student",
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setFormErrors([]);
      await updateAdminSettings({
        systemName: form.systemName,
        academicYear: form.academicYear,
        allowRegistration: form.allowRegistration,
        defaultRole: form.defaultRole,
      });
      toast.success("Settings updated successfully");
      await loadSettings();
      if (refreshSettings) {
        await refreshSettings();
      }
    } catch (err) {
      setFormErrors(err?.response?.data?.errors || []);
      toast.error(err?.response?.data?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <Error message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
        <p className="mt-2 text-sm text-gray-500">Manage global configuration for registration and defaults.</p>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-50 pb-4">
          <h2 className="text-lg font-bold text-gray-900">General</h2>
        </CardHeader>
        <CardBody>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <FormField
              label="System Name"
              value={form.systemName}
              onChange={(value) => setForm((prev) => ({ ...prev, systemName: value }))}
              required
            />
            <FormField
              label="Academic Year"
              value={form.academicYear}
              onChange={(value) => setForm((prev) => ({ ...prev, academicYear: value }))}
              placeholder="2025-26"
              required
            />
            <FormSelect
              label="Allow Registration"
              value={form.allowRegistration ? "true" : "false"}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  allowRegistration: event.target.value === "true",
                }))
              }
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </FormSelect>
            <FormSelect
              label="Default Role"
              value={form.defaultRole}
              onChange={(event) => setForm((prev) => ({ ...prev, defaultRole: event.target.value }))}
            >
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="parent">Parent</option>
              <option value="admin">Admin</option>
            </FormSelect>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
            {formErrors.length > 0 && (
              <div className="md:col-span-2 text-xs text-red-600">
                {formErrors.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            )}
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default Settings;
