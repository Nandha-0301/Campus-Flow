import React from "react";

const Error = ({ message = "Something went wrong.", onRetry, actionLabel = "Retry" }) => (
  <div className="flex min-h-[40vh] items-center justify-center px-6">
    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  </div>
);

export default Error;
