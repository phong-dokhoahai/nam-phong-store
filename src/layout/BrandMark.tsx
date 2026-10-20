import { cn } from "@/utils";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

/** "NP" monogram + product name; links to the inventory overview. */
export default function BrandMark({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();

  return (
    <Link
      to="/inventory"
      className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-none"
      aria-label={compact ? t("app.name") : undefined}
    >
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold tracking-tight text-white"
      >
        NP
      </span>
      <span className={cn("min-w-0 leading-tight", compact && "xl:sr-only")}>
        <span className="block truncate text-base font-semibold text-fg">
          {t("app.name")}
        </span>
        <span className="block truncate text-xs text-fg-muted">
          {t("app.tagline")}
        </span>
      </span>
    </Link>
  );
}
