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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading authentication...</div>;
  }

  if (!user) {
    console.log("ProtectedRoute: No user found after loading, redirecting to /login.");
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    if (user.role_id !== requiredRole) {
      const userDefaultPath = user.role_id === 1 ? '/admin'
                            : user.role_id === 2 ? '/customer'
                            : '/login';

      console.warn(`ProtectedRoute: Role mismatch. User role (${user.role_id}) !== Required role (${requiredRole}). Redirecting to ${userDefaultPath}.`);
      return <Navigate to={userDefaultPath} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;