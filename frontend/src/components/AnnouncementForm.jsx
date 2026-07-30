import React from "react";
import FormField from "./FormField";
import FormSelect from "./FormSelect";

const defaultTypeOptions = ["HOLIDAY", "EXAM", "INTERNAL", "EVENT", "GENERAL"];
const defaultTargetOptions = ["STUDENTS", "PARENTS"];

const AnnouncementForm = ({
  value,
  onChange,
  onSubmit,
  submitting = false,
  submitLabel = "Create Announcement",
  submittingLabel = "Creating...",
  classes = [],
  typeOptions = defaultTypeOptions,
  targetOptions = defaultTargetOptions,
  disableTarget = false,
  disableClass = false,
  disableSubmit = false,
  showClass = true,
  requireClass = false,
  classLabel = "Class",
  optionalClassLabel = "All classes",
  showActive = true,
  disableActive = false,
  emptyClassLabel = "No classes available",
}) => {
  const setField = (field, nextValue) => {
    onChange((prev) => ({ ...prev, [field]: nextValue }));
  };

  const hasClasses = classes.length > 0;

  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={onSubmit}>
      <FormField label="Title" value={value.title} onChange={(v) => setField("title", v)} required />
      <FormField label="Description" value={value.description} onChange={(v) => setField("description", v)} required />
      <FormSelect label="Type" value={value.type} onChange={(e) => setField("type", e.target.value)}>
        {typeOptions.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </FormSelect>
      <FormSelect
        label="Target"
        value={value.target}
        onChange={(e) => setField("target", e.target.value)}
        disabled={disableTarget}
      >
        {targetOptions.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </FormSelect>
      {showClass && (
        <FormSelect
          label={classLabel}
          value={value.classId}
          onChange={(e) => setField("classId", e.target.value)}
          disabled={disableClass || !hasClasses}
          required={requireClass}
        >
          {hasClasses ? (
            <>
              {requireClass ? (
                <option value="" disabled>Select class</option>
              ) : (
                <option value="">{optionalClassLabel}</option>
              )}
              {classes.map((item) => {
                const label =
                  item.className ||
                  [item.branch, item.semester, item.section].filter(Boolean).join(" ");
                return (
                  <option key={item._id} value={item._id}>{label}</option>
                );
              })}
            </>
          ) : (
            <option value="">{emptyClassLabel}</option>
          )}
        </FormSelect>
      )}
      {showActive && (
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={value.isActive}
            onChange={(e) => setField("isActive", e.target.checked)}
            disabled={disableActive}
          />
          Active
        </label>
      )}
      <div className="md:col-span-2">
        <button
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          disabled={submitting || disableSubmit}
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default AnnouncementForm;
