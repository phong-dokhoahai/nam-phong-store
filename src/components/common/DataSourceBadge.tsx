import Badge from "@/components/ui/badge/Badge";
import { useTranslation } from "react-i18next";

interface DataSourceBadgeProps {
  /** "supabase" when the list comes from the database, "demo" for fixtures. */
  source: "supabase" | "demo";
  /**
   * Save time of the offline copy being shown (`useAsyncData().cachedAt`);
   * null or omitted for live data.
   */
  cachedAt?: number | null;
}

/** Tells the user whether a list shows real data, an offline copy or demo fixtures. */
export default function DataSourceBadge({
  source,
  cachedAt,
}: DataSourceBadgeProps) {
  const { t, i18n } = useTranslation();

  if (cachedAt) {
    const savedAt = new Date(cachedAt).toLocaleString(i18n.language, {
      dateStyle: "short",
      timeStyle: "short",
    });

    return (
      <Badge size="sm" color="warning">
        {t("common.dataSource.offline", { time: savedAt })}
      </Badge>
    );
  }

  return (
    <Badge size="sm" color={source === "supabase" ? "success" : "warning"}>
      {t(
        source === "supabase"
          ? "common.dataSource.live"
          : "common.dataSource.demo",
      )}
    </Badge>
  );
}
