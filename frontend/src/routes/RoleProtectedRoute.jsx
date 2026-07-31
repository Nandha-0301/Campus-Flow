import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import { rolePathMap } from "../constants/rolePathMap";

const RoleProtectedRoute = ({ role: requiredRole, children }) => {
  const { user, role, loading } = useAuth();
  const resolvedRole = user?.role || role;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!resolvedRole) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
        <h1 className="text-xl font-bold text-gray-900">Account role not assigned</h1>
        <p className="max-w-md text-gray-600">
          Your Firebase account is signed in, but CampusFlow has no role on file. Contact your administrator or complete
          registration.
        </p>
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Back to sign in
        </Link>
      </div>
    );
  }

  if (!rolePathMap[resolvedRole]) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
        <h1 className="text-xl font-bold text-gray-900">Unsupported role</h1>
        <p className="max-w-md text-gray-600">
          Your account role &quot;{resolvedRole}&quot; is not recognized. Contact your administrator.
        </p>
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Back to sign in
        </Link>
      </div>
    );
  }

  if (resolvedRole !== requiredRole) {
    const target = rolePathMap[resolvedRole];
    console.info("RoleProtectedRoute: role mismatch redirect", {
      requiredRole,
      resolvedRole,
      target,
    });
    return <Navigate to={target} replace />;
  }

  return children;
};

export default RoleProtectedRoute;
