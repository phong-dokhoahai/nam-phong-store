import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useLocation } from "react-router";
import Button from "@/components/ui/button/Button";
import { useAuth } from "./AuthContext";
import { authErrorTranslationKeys } from "./authErrorMessages";

type ProtectedRouteProps = {
  children?: ReactNode;
};

type AuthStatusPanelProps = {
  message: string;
  role?: "status" | "alert";
  actions?: ReactNode;
};

function AuthStatusPanel({
  message,
  role = "status",
  actions,
}: AuthStatusPanelProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 text-center shadow-theme-sm">
        <p role={role} className="text-sm font-medium text-fg">
          {message}
        </p>
        {actions && (
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const {
    isLoading,
    isConfigured,
    isAuthenticated,
    isActive,
    profile,
    error,
    reload,
    signOut,
  } = useAuth();

  if (isLoading) {
    return <AuthStatusPanel message={t("auth.protected.loading")} />;
  }

  if (!isConfigured) {
    return <AuthStatusPanel message={t("auth.errors.configMissing")} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  const signOutButton = (
    <Button variant="outline" size="sm" onClick={() => void signOut()}>
      {t("userDropdown.signOut")}
    </Button>
  );

  // Signed in, but the profile could not be loaded (network or server error):
  // keep the session and offer a retry instead of a forced sign-out.
  if (!profile) {
    return (
      <AuthStatusPanel
        role="alert"
        message={t(
          authErrorTranslationKeys[error?.code ?? "AUTH_PROFILE_LOAD_FAILED"],
        )}
        actions={
          <>
            <Button size="sm" onClick={() => void reload()}>
              {t("common.retry")}
            </Button>
            {signOutButton}
          </>
        }
      />
    );
  }

  if (!isActive) {
    return (
      <AuthStatusPanel
        role="alert"
        message={
          error?.code === "AUTH_INACTIVE_ACCOUNT"
            ? t("auth.errors.inactive")
            : t("auth.protected.inactive")
        }
        actions={signOutButton}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
