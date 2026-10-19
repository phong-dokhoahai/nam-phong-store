import { useAuth, type AuthErrorCode } from "@/auth";
import InlineAlert from "@/components/common/InlineAlert";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import {
  ChevronLeftIcon,
  EyeCloseIcon,
  EyeIcon,
  GoogleIcon,
  XBrandIcon,
} from "@/icons";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";

type SignInLocationState = {
  from?: {
    pathname?: string;
    search?: string;
  };
};

const authErrorTranslationKeys: Record<AuthErrorCode, string> = {
  AUTH_CONFIG_MISSING: "auth.errors.configMissing",
  AUTH_INVALID_CREDENTIALS: "auth.errors.invalidCredentials",
  AUTH_INACTIVE_ACCOUNT: "auth.errors.inactive",
  AUTH_PROFILE_MISSING: "auth.errors.profileMissing",
  AUTH_UNKNOWN: "auth.errors.unknown",
};

export default function SignInForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isLoading, error, isConfigured, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const locationState = location.state as SignInLocationState | null;
  const destinationPath = locationState?.from?.pathname || "/";
  const destinationSearch = locationState?.from?.search || "";
  const authErrorMessage = error
    ? t(authErrorTranslationKeys[error.code])
    : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();

    try {
      await signIn({ email: email.trim(), password });
    } catch {
      return;
    }

    navigate(`${destinationPath}${destinationSearch}`, { replace: true });
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-md pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5 rtl:rotate-180" />
          {t("auth.signIn.backToDashboard")}
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">
              {t("auth.signIn.title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("auth.signIn.subtitle")}
            </p>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
              <button className="inline-flex items-center justify-center gap-3 rounded-lg bg-gray-100 px-7 py-3 text-sm font-normal text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                <GoogleIcon />
                {t("auth.signIn.google")}
              </button>
              <button className="inline-flex items-center justify-center gap-3 rounded-lg bg-gray-100 px-7 py-3 text-sm font-normal text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                <XBrandIcon className="fill-current" />
                {t("auth.signIn.x")}
              </button>
            </div>
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white p-2 text-gray-400 sm:px-5 sm:py-2 dark:bg-gray-900">
                  {t("auth.signIn.or")}
                </span>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {authErrorMessage && (
                  <InlineAlert>{authErrorMessage}</InlineAlert>
                )}
                {!isConfigured && (
                  <InlineAlert variant="warning">
                    {t("auth.errors.configMissing")}
                  </InlineAlert>
                )}
                <div>
                  <Label>
                    {t("auth.signIn.email")}{" "}
                    <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
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
                  <Label>
                    {t("auth.signIn.password")}{" "}
                    <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder={t("auth.signIn.passwordPlaceholder")}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={isLoading || !isConfigured}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-e-4 top-1/2 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                      aria-label={
                        showPassword
                          ? t("auth.signIn.hidePassword")
                          : t("auth.signIn.showPassword")
                      }
                      disabled={isLoading || !isConfigured}
                    >
                      {showPassword ? (
                        <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block text-theme-sm font-normal text-gray-700 dark:text-gray-400">
                      {t("auth.signIn.keepLoggedIn")}
                    </span>
                  </div>
                  <Link
                    to="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    {t("auth.signIn.forgotPassword")}
                  </Link>
                </div>
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    type="submit"
                    disabled={isLoading || !isConfigured}
                  >
                    {isLoading
                      ? t("auth.signIn.signingIn")
                      : t("auth.signIn.submit")}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-center text-sm font-normal text-gray-700 sm:text-start dark:text-gray-400">
                {t("auth.signIn.noAccount")} {""}
                <Link
                  to="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  {t("auth.signIn.signUp")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
