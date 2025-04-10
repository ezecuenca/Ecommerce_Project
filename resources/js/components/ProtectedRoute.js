import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const context = useContext(AuthContext);

  if (!context) {
    console.error("AuthContext is undefined. Ensure ProtectedRoute is wrapped in AuthProvider.");
    return <Navigate to="/" replace />;
  }

  const { user, loading } = context;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/admin" replace />;
  }

  if (requiredRole && user.role_id !== requiredRole) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;