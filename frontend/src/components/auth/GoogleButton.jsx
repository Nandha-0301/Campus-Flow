import React from "react";
import { Chrome } from "lucide-react";
import Loader from "../Loader";

const GoogleButton = ({ onClick, loading }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
  >
    {loading ? <Loader size={16} className="text-gray-600" /> : <Chrome size={16} />}
    Continue with Google
  </button>
);

export default GoogleButton;
