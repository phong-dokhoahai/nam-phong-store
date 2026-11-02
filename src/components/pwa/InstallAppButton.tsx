import { useAuth } from "@/auth";
import { usePwa } from "@/hooks/usePwa";
import { DownloadIcon } from "@/icons";
import { useTranslation } from "react-i18next";

/**
 * Header button that installs the app (home screen / desktop). Shown to
 * ADMIN only, and only when the browser offers installation.
 */
export default function InstallAppButton() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { canInstall, promptInstall } = usePwa();

  if (!canInstall || profile?.role !== "ADMIN") return null;

  return (
    <button
      type="button"
      onClick={() => void promptInstall()}
      aria-label={t("pwa.install")}
      title={t("pwa.install")}
      className="flex size-10 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-none"
    >
      <DownloadIcon />
    </button>
  );
}
