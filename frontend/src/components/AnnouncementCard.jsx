import React from "react";

const typePalette = {
  HOLIDAY: "bg-emerald-100 text-emerald-700",
  EXAM: "bg-red-100 text-red-700",
  INTERNAL: "bg-orange-100 text-orange-700",
  EVENT: "bg-blue-100 text-blue-700",
  GENERAL: "bg-gray-100 text-gray-700",
};

const AnnouncementCard = ({ title, description, type, className, isNew = false }) => {
  const badgeStyle = typePalette[type] || typePalette.GENERAL;

  return (
    <div
      className={`rounded-xl border p-4 ${
        isNew ? "border-indigo-200 bg-indigo-50" : "border-gray-100"
      } ${className || ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <div className="flex items-center gap-2">
          {isNew && (
            <span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-semibold text-indigo-700">
              New
            </span>
          )}
          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${badgeStyle}`}>{type}</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">{description}</p>
    </div>
  );
};

export default AnnouncementCard;
