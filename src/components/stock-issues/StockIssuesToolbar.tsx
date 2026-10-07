import { PlusIcon } from "@/icons";
import { useTranslation } from "react-i18next";
import type { StockIssueSource, StockIssueStatus } from "./types";

type StockIssuesToolbarProps = {
  search: string;
  status: "all" | StockIssueStatus;
  source: StockIssueSource;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: "all" | StockIssueStatus) => void;
  onCreate: () => void;
};

export default function StockIssuesToolbar({
  search,
  status,
  source,
  onSearchChange,
  onStatusChange,
  onCreate,
}: StockIssuesToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <input
          aria-label={t("stockIssues.toolbar.searchLabel")}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("stockIssues.toolbar.searchPlaceholder")}
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden sm:max-w-80 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        />
        <select
          aria-label={t("stockIssues.toolbar.statusLabel")}
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as "all" | StockIssueStatus)
          }
          className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pe-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
        >
          <option value="all">{t("stockIssues.toolbar.allStatuses")}</option>
          <option value="DRAFT">{t("stockIssues.status.DRAFT")}</option>
          <option value="CONFIRMED">{t("stockIssues.status.CONFIRMED")}</option>
          <option value="CANCELLED">{t("stockIssues.status.CANCELLED")}</option>
        </select>
        <span className="inline-flex h-11 items-center rounded-lg border border-gray-200 px-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          {t(
            source === "supabase"
              ? "stockIssues.toolbar.liveSource"
              : "stockIssues.toolbar.demoSource",
          )}
        </span>
      </div>

      <button
        type="button"
        onClick={onCreate}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white shadow-theme-xs transition-colors hover:bg-brand-600"
      >
        <PlusIcon className="size-4" />
        {t("stockIssues.actions.create")}
      </button>
    </div>
  );
}
