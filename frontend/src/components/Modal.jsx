import React from "react";

const Modal = ({ open, onClose, title, children, size = "md" }) => {
  if (!open) return null;

  const sizeClass =
    size === "lg" ? "max-w-3xl" : size === "sm" ? "max-w-md" : "max-w-xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
      <div className={`relative w-full ${sizeClass} rounded-2xl bg-white shadow-xl border border-gray-100`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-semibold text-gray-500 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
