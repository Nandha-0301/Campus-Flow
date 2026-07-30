import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Card, { CardBody, CardHeader } from "../../components/Card";
import FormField from "../../components/FormField";
import FormSelect from "../../components/FormSelect";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Loader from "../../components/Loader";
import Error from "../../components/Error";
import {
  assignTeaching,
  createSubject,
  deleteSubject,
  getAdminClasses,
  getAdminStaff,
  getAdminSubjectsWithMeta,
  updateSubject,
} from "../../api/admin";
import { getSubjects } from "../../api/campusflow";

const Academics = () => {
  const [subjects, setSubjects] = useState([]);
  const [assignableSubjects, setAssignableSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [subjectPagination, setSubjectPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });

  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    branch: "",
    semester: "1",
  });

  const [subjectErrors, setSubjectErrors] = useState([]);
  const [subjectLoading, setSubjectLoading] = useState(false);

  const [teachingAssignment, setTeachingAssignment] = useState({
    classId: "",
    subjectId: "",
    staffId: "",
  });

  const [teachingAssignLoading, setTeachingAssignLoading] = useState(false);
  const [teachingAssignErrors, setTeachingAssignErrors] = useState([]);

  const [editSubject, setEditSubject] = useState(null);
  const [editSubjectForm, setEditSubjectForm] = useState({ name: "", code: "", branch: "", semester: "1" });
  const [editSubjectErrors, setEditSubjectErrors] = useState([]);
  const [editSubjectLoading, setEditSubjectLoading] = useState(false);

  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState(null);
  const [deleteSubjectLoading, setDeleteSubjectLoading] = useState(false);

  const [viewSubject, setViewSubject] = useState(null);

  const loadSubjects = async ({ page = subjectPagination.page } = {}) => {
    try {
      setLoading(true);
      setError("");
      const subjectResponse = await getAdminSubjectsWithMeta({ page, limit: subjectPagination.limit });
      setSubjects(subjectResponse.data?.subjects || []);
      setSubjectPagination((prev) => ({
        ...prev,
        ...subjectResponse.meta?.pagination,
        page: subjectResponse.meta?.pagination?.page || page,
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load academic data");
      toast.error(err?.response?.data?.message || "Failed to load academic data");
    } finally {
      setLoading(false);
    }
  };

  const loadAssignableSubjects = async () => {
    try {
      const response = await getSubjects();
      const subjectRows = response?.data?.subjects || [];
      setAssignableSubjects(subjectRows);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load subjects");
    }
  };

  const loadStaff = async () => {
    try {
      const staffResponse = await getAdminStaff();
      setStaff(staffResponse.staff || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load staff list");
    }
  };

  const loadClasses = async () => {
    try {
      const classResponse = await getAdminClasses();
      setClasses(classResponse.classes || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load class list");
    }
  };

  useEffect(() => {
    loadSubjects({ page: 1 });
    loadAssignableSubjects();
    loadStaff();
    loadClasses();
  }, []);

  const selectedClass = useMemo(
    () => classes.find((item) => item._id === teachingAssignment.classId),
    [classes, teachingAssignment.classId]
  );

  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return [];
    return assignableSubjects.filter((subject) => (
      subject.branch === selectedClass.branch && Number(subject.semester) === Number(selectedClass.semester)
    ));
  }, [assignableSubjects, selectedClass]);

  const filteredStaff = useMemo(
    () => staff.filter((member) => member.userId?.role === "staff"),
    [staff]
  );

  const subjectColumns = useMemo(
    () => [
      { header: "Name", render: (row) => <span className="font-semibold text-gray-900">{row.name}</span> },
      { header: "Code", render: (row) => <span className="text-gray-600">{row.code}</span> },
      { header: "Branch", render: (row) => <span className="text-gray-600">{row.branch}</span> },
      { header: "Semester", render: (row) => <span className="text-gray-600">Semester {row.semester}</span> },
      {
        header: "Assigned Staff",
        render: (row) => {
          const staffList = row.assignedStaff || [];
          const primary = staffList[0];
          const extraCount = Math.max(staffList.length - 1, 0);
          const primaryName = primary?.userId?.name || "Staff";
          const label = staffList.length
            ? extraCount
              ? `${primaryName} +${extraCount} more`
              : primaryName
            : "Unassigned";
          const meta = staffList.length === 1
            ? primary?.userId?.email || ""
            : staffList.length
              ? `${staffList.length} staff assigned`
              : "";

          return (
            <div>
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{meta}</p>
            </div>
          );
        },
      },
      {
        header: "Classes",
        render: (row) => <span className="text-gray-600">{row.assignedClassesCount || 0}</span>,
      },
      {
        header: "Students",
        render: (row) => <span className="text-gray-600">{row.studentsCount || 0}</span>,
      },
      {
        header: "Actions",
        render: (row) => (
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              onClick={() => setViewSubject(row)}
            >
              View
            </button>
            <button
              className="rounded-lg border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              onClick={() => {
                setEditSubjectErrors([]);
                setEditSubject(row);
                setEditSubjectForm({
                  name: row.name,
                  code: row.code,
                  branch: row.branch,
                  semester: String(row.semester),
                });
              }}
            >
              Edit
            </button>
            <button
              className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
              onClick={() => setDeleteSubjectTarget(row)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const handleCreateSubject = async (event) => {
    event.preventDefault();
    setSubjectErrors([]);

    const trimmedName = subjectForm.name.trim();
    const trimmedCode = subjectForm.code.trim();
    const trimmedBranch = subjectForm.branch.trim();
    const semesterValue = Number(subjectForm.semester);

    const errors = [];
    if (!trimmedName) errors.push("name is required");
    if (!trimmedCode) errors.push("code is required");
    if (!trimmedBranch) errors.push("branch is required");
    if (![1, 2, 3, 4, 5, 6, 7, 8].includes(semesterValue)) errors.push("semester must be 1-8");

    if (errors.length) {
      setSubjectErrors(errors);
      toast.error("Please fix subject form errors");
      return;
    }

    try {
      setSubjectLoading(true);
      await createSubject({
        name: trimmedName,
        code: trimmedCode,
        branch: trimmedBranch,
        semester: semesterValue,
      });
      toast.success("Subject created successfully");
      setSubjectForm({ name: "", code: "", branch: "", semester: "1" });
      await loadSubjects({ page: 1 });
      await loadAssignableSubjects();
    } catch (err) {
      setSubjectErrors(err?.response?.data?.errors || []);
      toast.error(err?.response?.data?.message || "Failed to create subject");
    } finally {
      setSubjectLoading(false);
    }
  };

  const handleAssignTeaching = async (event) => {
    event.preventDefault();
    setTeachingAssignErrors([]);

    const errors = [];
    if (!teachingAssignment.classId) errors.push("class is required");
    if (!teachingAssignment.subjectId) errors.push("subject is required");
    if (!teachingAssignment.staffId) errors.push("staff is required");

    if (errors.length) {
      setTeachingAssignErrors(errors);
      toast.error("Please fix teaching assignment errors");
      return;
    }

    try {
      setTeachingAssignLoading(true);
      await assignTeaching({
        classId: teachingAssignment.classId,
        subjectId: teachingAssignment.subjectId,
        staffId: teachingAssignment.staffId,
      });
      toast.success("Teaching assigned successfully");
      setTeachingAssignment({ classId: "", subjectId: "", staffId: "" });
      await loadSubjects({ page: subjectPagination.page });
      await loadAssignableSubjects();
    } catch (err) {
      setTeachingAssignErrors(err?.response?.data?.errors || []);
      toast.error(err?.response?.data?.message || "Failed to assign teaching");
    } finally {
      setTeachingAssignLoading(false);
    }
  };

  const handleSubjectEdit = async (event) => {
    event.preventDefault();
    if (!editSubject) return;
    setEditSubjectErrors([]);
    try {
      setEditSubjectLoading(true);
      await updateSubject(editSubject._id, {
        name: editSubjectForm.name,
        code: editSubjectForm.code,
        branch: editSubjectForm.branch,
        semester: Number(editSubjectForm.semester),
      });
      toast.success("Subject updated successfully");
      setEditSubject(null);
      await loadSubjects({ page: subjectPagination.page });
      await loadAssignableSubjects();
    } catch (err) {
      setEditSubjectErrors(err?.response?.data?.errors || []);
      toast.error(err?.response?.data?.message || "Failed to update subject");
    } finally {
      setEditSubjectLoading(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!deleteSubjectTarget) return;
    try {
      setDeleteSubjectLoading(true);
      await deleteSubject(deleteSubjectTarget._id);
      toast.success("Subject deleted successfully");
      setDeleteSubjectTarget(null);
      await loadSubjects({ page: subjectPagination.page });
      await loadAssignableSubjects();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete subject");
    } finally {
      setDeleteSubjectLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <Error message={error} />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Academics</h1>
        <p className="mt-2 text-sm text-gray-500">Create subjects and manage teaching assignments.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="border-b border-gray-50 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Create Subject</h2>
          </CardHeader>
          <CardBody>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleCreateSubject}>
              <FormField label="Subject Name" value={subjectForm.name} onChange={(v) => setSubjectForm((p) => ({ ...p, name: v }))} required />
              <FormField label="Code" value={subjectForm.code} onChange={(v) => setSubjectForm((p) => ({ ...p, code: v }))} required />
              <FormField label="Branch" value={subjectForm.branch} onChange={(v) => setSubjectForm((p) => ({ ...p, branch: v }))} required />
              <FormField
                label="Semester"
                type="number"
                value={subjectForm.semester}
                onChange={(v) => setSubjectForm((p) => ({ ...p, semester: v }))}
                required
              />
              <div className="md:col-span-2">
                <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60" disabled={subjectLoading}>
                  {subjectLoading ? "Creating..." : "Create Subject"}
                </button>
              </div>
              {subjectErrors.length > 0 && (
                <div className="md:col-span-2 text-xs text-red-600">
                  {subjectErrors.map((errItem) => (
                    <p key={errItem}>{errItem}</p>
                  ))}
                </div>
              )}
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="border-b border-gray-50 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Assign Teaching</h2>
          </CardHeader>
          <CardBody>
            <form className="space-y-3" onSubmit={handleAssignTeaching}>
              <FormSelect
                label="Class"
                value={teachingAssignment.classId}
                onChange={(e) =>
                  setTeachingAssignment((prev) => ({
                    ...prev,
                    classId: e.target.value,
                    subjectId: "",
                  }))
                }
                required
              >
                <option value="" disabled>
                  Select class
                </option>
                {classes.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.className || `${item.branch} - Semester ${item.semester} ${item.section}`}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                label="Subject"
                value={teachingAssignment.subjectId}
                onChange={(e) => setTeachingAssignment((prev) => ({ ...prev, subjectId: e.target.value }))}
                required
                disabled={!selectedClass}
              >
                <option value="" disabled>
                  {selectedClass ? "Select subject" : "Select class first"}
                </option>
                {filteredSubjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                label="Staff"
                value={teachingAssignment.staffId}
                onChange={(e) => setTeachingAssignment((prev) => ({ ...prev, staffId: e.target.value }))}
                required
              >
                <option value="" disabled>
                  Select staff
                </option>
                {filteredStaff.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.userId?.name || "Staff"} - {member.userId?.email || ""} ({member.department})
                  </option>
                ))}
              </FormSelect>

              {!classes.length && <p className="text-xs text-gray-400">Create a class to enable teaching assignments.</p>}
              {selectedClass && !filteredSubjects.length && (
                <p className="text-xs text-gray-400">No subjects match the selected class branch/semester.</p>
              )}
              {!filteredStaff.length && <p className="text-xs text-gray-400">Create a staff account to enable assignments.</p>}

              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60" disabled={teachingAssignLoading}>
                {teachingAssignLoading ? "Assigning..." : "Assign Teaching"}
              </button>
              {teachingAssignErrors.length > 0 && (
                <div className="text-xs text-red-600">
                  {teachingAssignErrors.map((errItem) => (
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
          <h2 className="text-lg font-bold text-gray-900">Subjects</h2>
        </CardHeader>
        <div className="p-0 overflow-x-auto">
          <Table columns={subjectColumns} data={subjects} keyField="_id" />
        </div>
        <CardBody>
          <Pagination
            page={subjectPagination.page}
            totalPages={subjectPagination.totalPages || 1}
            total={subjectPagination.total}
            limit={subjectPagination.limit}
            label="subjects"
            loading={loading}
            onPageChange={(nextPage) => loadSubjects({ page: Math.max(1, Math.min(subjectPagination.totalPages || 1, nextPage)) })}
          />
        </CardBody>
      </Card>

      <Modal open={!!viewSubject} onClose={() => setViewSubject(null)} title="Subject Details" size="sm">
        {viewSubject && (
          <div className="space-y-3 text-sm text-gray-700">
            <Detail label="Name" value={viewSubject.name} />
            <Detail label="Code" value={viewSubject.code} />
            <Detail label="Branch" value={viewSubject.branch} />
            <Detail label="Semester" value={`Semester ${viewSubject.semester}`} />
            <Detail
              label="Assigned Staff"
              value={(viewSubject.assignedStaff || []).map((staffItem) => staffItem.userId?.name || "Staff").join(", ") || "Unassigned"}
            />
            <Detail label="Assigned Classes" value={viewSubject.assignedClassesCount || 0} />
            <Detail label="Students Count" value={viewSubject.studentsCount || 0} />
          </div>
        )}
      </Modal>

      <Modal open={!!editSubject} onClose={() => setEditSubject(null)} title="Edit Subject" size="sm">
        {editSubject && (
          <form className="space-y-3" onSubmit={handleSubjectEdit}>
            <FormField label="Subject Name" value={editSubjectForm.name} onChange={(v) => setEditSubjectForm((p) => ({ ...p, name: v }))} required />
            <FormField label="Code" value={editSubjectForm.code} onChange={(v) => setEditSubjectForm((p) => ({ ...p, code: v }))} required />
            <FormField label="Branch" value={editSubjectForm.branch} onChange={(v) => setEditSubjectForm((p) => ({ ...p, branch: v }))} required />
            <FormField label="Semester" type="number" value={editSubjectForm.semester} onChange={(v) => setEditSubjectForm((p) => ({ ...p, semester: v }))} required />
            {editSubjectErrors.length > 0 && (
              <div className="text-xs text-red-600">
                {editSubjectErrors.map((errItem) => (
                  <p key={errItem}>{errItem}</p>
                ))}
              </div>
            )}
            <button className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60" disabled={editSubjectLoading}>
              {editSubjectLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </Modal>

      <Modal open={!!deleteSubjectTarget} onClose={() => setDeleteSubjectTarget(null)} title="Delete Subject" size="sm">
        {deleteSubjectTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              This will delete <span className="font-semibold">{deleteSubjectTarget.name}</span>. Deletion is blocked if assigned to classes or students.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                onClick={() => setDeleteSubjectTarget(null)}
                disabled={deleteSubjectLoading}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                onClick={handleDeleteSubject}
                disabled={deleteSubjectLoading}
              >
                {deleteSubjectLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const Detail = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <p className="text-sm font-semibold text-gray-900">{value || "-"}</p>
  </div>
);

export default Academics;
