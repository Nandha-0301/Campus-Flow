import React from "react";

const FormSelect = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  multiple = false,
  children,
}) => (
  <div>
    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</label>
    <select
      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      multiple={multiple}
    >
      {children}
    </select>
  </div>
);

export default FormSelect;
