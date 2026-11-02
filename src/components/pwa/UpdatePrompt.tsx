import Button from "@/components/ui/button/Button";
import { usePwa } from "@/hooks/usePwa";
import { useTranslation } from "react-i18next";

/** Offers to reload when a new version of the app has been installed. */
export default function UpdatePrompt() {
  const { t } = useTranslation();
  const { isUpdateAvailable, applyUpdate } = usePwa();

  if (!isUpdateAvailable) return null;

  return (
    <div
      role="status"
      className="fixed end-4 bottom-4 z-9999 flex max-w-sm items-center gap-4 rounded-xl border border-line bg-white p-4 shadow-theme-lg dark:bg-gray-900"
    >
      <p className="text-sm text-fg">{t("pwa.updateAvailable")}</p>
      <Button size="sm" className="shrink-0" onClick={applyUpdate}>
        {t("pwa.reload")}
      </Button>
    </div>
  );
}
