import { authErrorTranslationKeys, useAuth } from "@/auth";
import InlineAlert from "@/components/common/InlineAlert";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation } from "react-router";

type SignInLocationState = {
  from?: {
    pathname?: string;
    search?: string;
  };
};

export default function SignInForm() {
  const { t } = useTranslation();
  const location = useLocation();
  const {
    signIn,
    isLoading,
    error,
    isConfigured,
    isAuthenticated,
    isActive,
    clearError,
  } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const locationState = location.state as SignInLocationState | null;
  const destinationPath = locationState?.from?.pathname || "/";
  const destinationSearch = locationState?.from?.search || "";
  const authErrorMessage = error
    ? t(authErrorTranslationKeys[error.code])
    : null;

  // Signed in with an active profile (just now, or already when opening
  // /signin): go to the page that sent the user here.
  if (isAuthenticated && isActive) {
    return <Navigate to={`${destinationPath}${destinationSearch}`} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();

    try {
      await signIn({ email: email.trim(), password });
    } catch {
      // The error is shown from the auth context.
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-center px-1 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-fg">
            {t("auth.signIn.title")}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {t("auth.signIn.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {authErrorMessage && <InlineAlert>{authErrorMessage}</InlineAlert>}
          {!isConfigured && (
            <InlineAlert variant="warning">
              {t("auth.errors.configMissing")}
            </InlineAlert>
          )}
          <div>
            <Label htmlFor="signin-email">{t("auth.signIn.email")}</Label>
            <Input
              id="signin-email"
              type="email"
              name="email"
              placeholder={t("auth.signIn.emailPlaceholder")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading || !isConfigured}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="signin-password">{t("auth.signIn.password")}</Label>
            <div className="relative">
              <Input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={t("auth.signIn.passwordPlaceholder")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading || !isConfigured}
                required
                autoComplete="current-password"
                className="pe-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-e-2 top-1/2 z-30 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-fg-muted hover:text-fg focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-none"
                aria-label={
                  showPassword
                    ? t("auth.signIn.hidePassword")
                    : t("auth.signIn.showPassword")
                }
                aria-pressed={showPassword}
                disabled={isLoading || !isConfigured}
              >
                {showPassword ? (
                  <EyeIcon className="size-5 fill-current" />
                ) : (
                  <EyeCloseIcon className="size-5 fill-current" />
                )}
              </button>
            </div>
          </div>
          <Button
            className="w-full"
            type="submit"
            loading={isLoading}
            disabled={!isConfigured}
          >
            {isLoading ? t("auth.signIn.signingIn") : t("auth.signIn.submit")}
          </Button>
        </form>

        <p className="mt-6 text-sm text-fg-muted">
          {t("auth.signIn.accountHelp")}
        </p>
      </div>
    </div>
  );
}
