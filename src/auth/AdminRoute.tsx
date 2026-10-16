import { Navigate, Outlet } from "react-router";
import { useAuth } from "./AuthContext";

/**
 * UX guard only. The real restriction is enforced in the database
 * (RLS / is_admin() inside report views).
 */
export function AdminRoute() {
  const { profile } = useAuth();

  if (profile?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
