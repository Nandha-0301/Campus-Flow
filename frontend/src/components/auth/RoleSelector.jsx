import React from "react";

const roles = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "student", label: "Student" },
  { value: "parent", label: "Parent" },
];

const RoleSelector = ({ selectedRole, setSelectedRole }) => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {roles.map((role) => {
        const isActive = selectedRole === role.value;

        return (
          <button
            key={role.value}
            type="button"
            onClick={() => setSelectedRole(role.value)}
            className={`rounded-2xl border p-4 text-left shadow-md transition-all duration-200 ${
              isActive
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:shadow-lg"
            }`}
          >
            <p className="text-sm font-semibold">{role.label}</p>
            <p className="mt-1 text-xs text-gray-500 capitalize">Role: {role.value}</p>
          </button>
        );
      })}
    </div>
  );
};

export default RoleSelector;
