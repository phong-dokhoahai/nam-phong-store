import Badge from "@/components/ui/badge/Badge";
import { useTranslation } from "react-i18next";

interface DataSourceBadgeProps {
  /** "supabase" when the list comes from the database, "demo" for fixtures. */
  source: "supabase" | "demo";
}

/** Tells the user whether a list shows real data or demo fixtures. */
export default function DataSourceBadge({ source }: DataSourceBadgeProps) {
  const { t } = useTranslation();

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
