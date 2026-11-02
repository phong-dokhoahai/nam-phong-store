import InlineAlert from "@/components/common/InlineAlert";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useTranslation } from "react-i18next";

/** Shown above the page content while the device has no network. */
export default function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <InlineAlert variant="warning" className="mb-4">
      {t("pwa.offlineBanner")}
    </InlineAlert>
  );
}
