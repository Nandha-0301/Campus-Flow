import React from "react";

const Pagination = ({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 0,
  onPageChange,
  loading = false,
  label = "records",
}) => {
  const show = totalPages > 1 || total > limit;
  if (!show) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p className="text-xs text-gray-500">
        Showing page {page} of {totalPages} · {total} {label}
      </p>
      <div className="flex gap-2">
        <button
          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 disabled:opacity-50"
          onClick={() => onPageChange?.(page - 1)}
          disabled={!canPrev || loading}
        >
          Previous
        </button>
        <button
          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 disabled:opacity-50"
          onClick={() => onPageChange?.(page + 1)}
          disabled={!canNext || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
