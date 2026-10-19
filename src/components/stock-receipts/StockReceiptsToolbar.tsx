import SearchInput from "@/components/common/SearchInput";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";
import { useTranslation } from "react-i18next";
import type { StockReceiptSource, StockReceiptStatus } from "./types";

type StockReceiptsToolbarProps = {
  search: string;
  status: "all" | StockReceiptStatus;
  source: StockReceiptSource;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: "all" | StockReceiptStatus) => void;
  onCreate: () => void;
};

export default function StockReceiptsToolbar({
  search,
  status,
  source,
  onSearchChange,
  onStatusChange,
  onCreate,
}: StockReceiptsToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="w-full sm:max-w-80">
          <SearchInput
            aria-label={t("stockReceipts.toolbar.searchLabel")}
            value={search}
            onChange={onSearchChange}
            placeholder={t("stockReceipts.toolbar.searchPlaceholder")}
          />
        </div>
        <div className="sm:w-56">
          <Select
            aria-label={t("stockReceipts.toolbar.statusLabel")}
            value={status}
            onChange={(value) =>
              onStatusChange(value as "all" | StockReceiptStatus)
            }
            options={[
              { value: "all", label: t("stockReceipts.toolbar.allStatuses") },
              { value: "DRAFT", label: t("stockReceipts.status.DRAFT") },
              {
                value: "CONFIRMED",
                label: t("stockReceipts.status.CONFIRMED"),
              },
              {
                value: "CANCELLED",
                label: t("stockReceipts.status.CANCELLED"),
              },
            ]}
          />
        </div>
        <span className="inline-flex h-11 items-center rounded-lg border border-gray-200 px-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          {t(
            source === "supabase"
              ? "stockReceipts.toolbar.liveSource"
              : "stockReceipts.toolbar.demoSource",
          )}
        </span>
      </div>

      <Button startIcon={<PlusIcon className="size-5" />} onClick={onCreate}>
        {t("stockReceipts.actions.create")}
      </Button>
    </div>
  );
}
