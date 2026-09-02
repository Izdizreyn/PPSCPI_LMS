import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/",
}) {
  const { user, token, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!token || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}