import React from "react";

const FormField = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  placeholder,
}) => (
  <div>
    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</label>
    <input
      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
      value={value}
      type={type}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
    />
  </div>
);

export default FormField;
