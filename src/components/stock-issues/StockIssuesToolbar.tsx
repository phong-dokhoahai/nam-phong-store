import SearchInput from "@/components/common/SearchInput";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
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
        <div className="w-full sm:max-w-80">
          <SearchInput
            aria-label={t("stockIssues.toolbar.searchLabel")}
            value={search}
            onChange={onSearchChange}
            placeholder={t("stockIssues.toolbar.searchPlaceholder")}
          />
        </div>
        <div className="sm:w-56">
          <Select
            aria-label={t("stockIssues.toolbar.statusLabel")}
            value={status}
            onChange={(value) =>
              onStatusChange(value as "all" | StockIssueStatus)
            }
            options={[
              { value: "all", label: t("stockIssues.toolbar.allStatuses") },
              { value: "DRAFT", label: t("stockIssues.status.DRAFT") },
              { value: "CONFIRMED", label: t("stockIssues.status.CONFIRMED") },
              { value: "CANCELLED", label: t("stockIssues.status.CANCELLED") },
            ]}
          />
        </div>
        <span className="inline-flex h-11 items-center rounded-lg border border-gray-200 px-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          {t(
            source === "supabase"
              ? "stockIssues.toolbar.liveSource"
              : "stockIssues.toolbar.demoSource",
          )}
        </span>
      </div>

      <Button startIcon={<PlusIcon className="size-5" />} onClick={onCreate}>
        {t("stockIssues.actions.create")}
      </Button>
    </div>
  );
}
