import React, { Suspense, lazy, memo } from "react";
import { ShieldCheck, UserCog, GraduationCap, Users } from "lucide-react";
import GoogleButton from "./GoogleButton";

const LoginForm = lazy(() => import("./LoginForm"));
const SignupForm = lazy(() => import("./SignupForm"));

const roleMeta = {
  admin: {
    label: "Admin",
    description: "Manage staff, subjects, and campus-wide setup.",
    icon: ShieldCheck,
  },
  staff: {
    label: "Staff",
    description: "Update marks, attendance, and assignments quickly.",
    icon: UserCog,
  },
  student: {
    label: "Student",
    description: "Track your marks, attendance, and notices.",
    icon: GraduationCap,
  },
  parent: {
    label: "Parent",
    description: "Monitor your child performance and academic updates.",
    icon: Users,
  },
};

const RoleCard = ({
  role,
  activeRole,
  setActiveRole,
  mode,
  setMode,
  loading,
  error,
  onLogin,
  onSignup,
  onGoogleLogin,
  selectionOnly = false,
  showSelector = true,
}) => {
  const meta = roleMeta[role];
  const Icon = meta.icon;
  const isActive = showSelector ? activeRole === role : true;

  if (selectionOnly) {
    return (
      <button
        type="button"
        onClick={() => setActiveRole(role)}
        disabled={loading}
        className="flex items-center gap-4 px-6 py-4 rounded-full bg-white shadow-md hover:shadow-xl hover:scale-105 transition-all cursor-pointer w-full disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
      >
        <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <Icon size={22} />
        </div>
        <p className="text-lg font-bold text-gray-900">{meta.label}</p>
      </button>
    );
  }

  return (
    <article
      className={[
        "rounded-2xl border bg-white p-5 shadow-md transition-all duration-300",
        isActive ? "border-blue-500 bg-blue-50/50 shadow-blue-100" : "border-gray-200 hover:scale-[1.01] hover:shadow-lg",
      ].join(" ")}
    >
      {showSelector ? (
        <button
          type="button"
          onClick={() => setActiveRole((current) => (current === role ? null : role))}
          disabled={loading}
          className="w-full text-left"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
              <Icon size={18} />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">{meta.label}</p>
              <p className="mt-1 text-xs text-gray-500">{meta.description}</p>
            </div>
          </div>
        </button>
      ) : null}

      <div className={`overflow-hidden transition-all duration-300 ${isActive ? "max-h-[860px] pt-4" : "max-h-0"}`}>
        {isActive ? (
          <>
            <div className="mb-3 flex rounded-xl border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                disabled={loading}
                className={`w-1/2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  mode === "login" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                } disabled:cursor-not-allowed disabled:opacity-70`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                disabled={loading}
                className={`w-1/2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  mode === "signup" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                } disabled:cursor-not-allowed disabled:opacity-70`}
              >
                Sign Up
              </button>
            </div>

            {error ? <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

            <Suspense fallback={<div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-500">Loading form...</div>}>
              {mode === "login" ? (
                <LoginForm onSubmit={onLogin} loading={loading} />
              ) : (
                <SignupForm role={role} onSubmit={onSignup} loading={loading} />
              )}
            </Suspense>

            <GoogleButton onClick={onGoogleLogin} loading={loading} />
          </>
        ) : null}
      </div>
    </article>
  );
};

export default memo(RoleCard);
