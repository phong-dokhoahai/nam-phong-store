import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthContext";

type ProtectedRouteProps = {
  children?: ReactNode;
};

function AuthStatusPanel({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {message}
        </p>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { isLoading, isConfigured, isAuthenticated, isActive, error } =
    useAuth();

  if (isLoading) {
    return <AuthStatusPanel message={t("auth.protected.loading")} />;
  }

  if (!isConfigured) {
    return <AuthStatusPanel message={t("auth.errors.configMissing")} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  if (!isActive) {
    return (
      <AuthStatusPanel
        message={
          error?.code === "AUTH_INACTIVE_ACCOUNT"
            ? t("auth.errors.inactive")
            : t("auth.protected.inactive")
        }
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
