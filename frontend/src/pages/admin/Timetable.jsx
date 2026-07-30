import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Card, { CardBody, CardHeader } from "../../components/Card";
import FormField from "../../components/FormField";
import FormSelect from "../../components/FormSelect";
import Table from "../../components/Table";
import Skeleton from "../../components/Skeleton";
import Pagination from "../../components/Pagination";
import Loader from "../../components/Loader";
import Error from "../../components/Error";
import {
  createTimetableSlot,
  getAdminClasses,
  getAdminStaff,
  getAdminSubjects,
  getAdminTimetableWithMeta,
} from "../../api/admin";

const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const Timetable = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedClassId, setSelectedClassId] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [timetablePagination, setTimetablePagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });

  const [form, setForm] = useState({
    classId: "",
    subjectId: "",
    staffId: "",
    day: "Monday",
    startTime: "09:00",
    endTime: "10:00",
  });
  const [formErrors, setFormErrors] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  const loadBaseData = async () => {
    try {
      setLoading(true);
      setError("");
      const [classRes, subjectRes, staffRes] = await Promise.all([
        getAdminClasses(),
        getAdminSubjects(),
        getAdminStaff(),
      ]);
      setClasses(classRes.classes || []);
      setSubjects(subjectRes.subjects || []);
      setStaff(staffRes.staff || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load timetable data");
    } finally {
      setLoading(false);
    }
  };

  const loadTimetable = async ({ page = timetablePagination.page } = {}) => {
    if (!selectedClassId) return;
    try {
      setTimetableLoading(true);
      const response = await getAdminTimetableWithMeta({
        classId: selectedClassId,
        page,
        limit: timetablePagination.limit,
      });
      setTimetable(response.data?.timetable || []);
      setTimetablePagination((prev) => ({
        ...prev,
        ...response.meta?.pagination,
        page: response.meta?.pagination?.page || page,
      }));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load timetable");
    } finally {
      setTimetableLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      setTimetable([]);
      setTimetablePagination((prev) => ({ ...prev, page: 1, totalPages: 1, total: 0 }));
      return;
    }

    loadTimetable({ page: 1 });
  }, [selectedClassId]);

  const selectedClass = useMemo(
    () => classes.find((item) => item._id === selectedClassId),
    [classes, selectedClassId]
  );

  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return subjects;
    return subjects.filter((subject) => subject.branch === selectedClass.branch && subject.semester === selectedClass.semester);
  }, [subjects, selectedClass]);

  const handleCreateSlot = async (event) => {
    event.preventDefault();
    setFormErrors([]);
    try {
      setFormLoading(true);
      await createTimetableSlot({
        classId: form.classId,
        subjectId: form.subjectId,
        staffId: form.staffId,
        day: form.day,
        startTime: form.startTime,
        endTime: form.endTime,
      });
      toast.success("Timetable slot created successfully");
      setForm((prev) => ({
        ...prev,
        subjectId: "",
        staffId: "",
      }));
      if (selectedClassId) {
        await loadTimetable({ page: timetablePagination.page });
      }
    } catch (err) {
      setFormErrors(err?.response?.data?.errors || []);
      toast.error(err?.response?.data?.message || "Failed to create slot");
    } finally {
      setFormLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      { header: "Day", render: (row) => <span className="text-gray-700">{row.day}</span> },
      {
        header: "Time",
        render: (row) => (
          <span className="text-gray-700">
            {row.startTime} - {row.endTime}
          </span>
        ),
      },
      {
        header: "Subject",
        render: (row) => (
          <div>
            <p className="text-sm font-semibold text-gray-900">{row.subjectId?.name}</p>
            <p className="text-xs text-gray-500">{row.subjectId?.code}</p>
          </div>
        ),
      },
      {
        header: "Staff",
        render: (row) => (
          <div>
            <p className="text-sm font-semibold text-gray-900">{row.staffId?.userId?.name || "Staff"}</p>
            <p className="text-xs text-gray-500">{row.staffId?.userId?.email || ""}</p>
          </div>
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Timetable</h1>
        <p className="mt-2 text-sm text-gray-500">Assign timetable slots without clashes across each class.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <Card className="xl:col-span-1">
          <CardHeader className="border-b border-gray-50 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Select Class</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <FormSelect
              label="Class"
              value={selectedClassId}
              onChange={(e) => {
                const nextClassId = e.target.value;
                setSelectedClassId(nextClassId);
                setForm((prev) => ({
                  ...prev,
                  classId: nextClassId,
                  subjectId: "",
                  staffId: "",
                }));
              }}
              required
            >
              <option value="" disabled>
                Select class
              </option>
              {classes.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.className}
                </option>
              ))}
            </FormSelect>

            {selectedClass && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                Branch: {selectedClass.branch} · Semester {selectedClass.semester} · Section {selectedClass.section}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="border-b border-gray-50 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Create Timetable Slot</h2>
          </CardHeader>
          <CardBody>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleCreateSlot}>
              <FormSelect
                label="Subject"
                value={form.subjectId}
                onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}
                required
                disabled={!selectedClassId}
              >
                <option value="" disabled>
                  Select subject
                </option>
                {filteredSubjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.code} · {subject.name}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                label="Staff"
                value={form.staffId}
                onChange={(e) => setForm((prev) => ({ ...prev, staffId: e.target.value }))}
                required
                disabled={!selectedClassId}
              >
                <option value="" disabled>
                  Select staff
                </option>
                {staff.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.userId?.name || "Staff"} · {member.department}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                label="Day"
                value={form.day}
                onChange={(e) => setForm((prev) => ({ ...prev, day: e.target.value }))}
                required
                disabled={!selectedClassId}
              >
                {dayOptions.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </FormSelect>

              <FormField
                label="Start Time"
                type="time"
                value={form.startTime}
                onChange={(value) => setForm((prev) => ({ ...prev, startTime: value }))}
                required
                disabled={!selectedClassId}
              />
              <FormField
                label="End Time"
                type="time"
                value={form.endTime}
                onChange={(value) => setForm((prev) => ({ ...prev, endTime: value }))}
                required
                disabled={!selectedClassId}
              />

              <div className="md:col-span-2">
                <button
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  disabled={formLoading || !selectedClassId}
                >
                  {formLoading ? "Saving..." : "Add Slot"}
                </button>
              </div>

              {formErrors.length > 0 && (
                <div className="md:col-span-2 text-xs text-red-600">
                  {formErrors.map((errItem) => (
                    <p key={errItem}>{errItem}</p>
                  ))}
                </div>
              )}
            </form>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-50 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Class Timetable</h2>
        </CardHeader>
        <div className="p-0 overflow-x-auto">
          {loading || timetableLoading ? (
            <div className="p-6">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <Table columns={columns} data={timetable} keyField="_id" />
          )}
          {!timetableLoading && selectedClassId && timetable.length === 0 && (
            <div className="p-6 text-sm text-gray-500">No timetable slots yet for this class.</div>
          )}
          {!selectedClassId && !loading && (
            <div className="p-6 text-sm text-gray-500">Select a class to view its timetable.</div>
          )}
        </div>
        <CardBody>
          <Pagination
            page={timetablePagination.page}
            totalPages={timetablePagination.totalPages || 1}
            total={timetablePagination.total}
            limit={timetablePagination.limit}
            label="timetable slots"
            loading={timetableLoading}
            onPageChange={(nextPage) => loadTimetable({ page: Math.max(1, Math.min(timetablePagination.totalPages || 1, nextPage)) })}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default Timetable;
