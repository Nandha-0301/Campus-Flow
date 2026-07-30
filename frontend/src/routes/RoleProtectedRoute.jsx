import React from "react";
import { Navigate } from "react-router-dom";
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
    return <Navigate to="/login" replace />;
  }

  if (resolvedRole !== requiredRole) {
    return <Navigate to={rolePathMap[resolvedRole] || "/login"} replace />;
  }

  return children;
};

export default RoleProtectedRoute;

