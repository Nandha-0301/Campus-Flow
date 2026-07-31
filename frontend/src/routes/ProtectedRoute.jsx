import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

const ProtectedRoute = ({ children }) => {
  const { user, loading, firebaseUid } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader />
      </div>
    );
  }

  if (!user) {
    console.info("ProtectedRoute: redirect to login", {
      hasFirebaseSession: Boolean(firebaseUid),
      reason: firebaseUid ? "backend_profile_missing" : "not_authenticated",
    });
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
