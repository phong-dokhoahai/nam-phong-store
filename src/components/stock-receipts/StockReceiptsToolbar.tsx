import FilterToolbar from "@/components/common/FilterToolbar";
import SearchInput from "@/components/common/SearchInput";
import Select from "@/components/form/Select";
import { useTranslation } from "react-i18next";
import type { StockReceiptStatus } from "./types";

type StockReceiptsToolbarProps = {
  search: string;
  status: "all" | StockReceiptStatus;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: "all" | StockReceiptStatus) => void;
};

const statuses: StockReceiptStatus[] = ["DRAFT", "CONFIRMED", "CANCELLED"];

export default function StockReceiptsToolbar({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: StockReceiptsToolbarProps) {
  const { t } = useTranslation();

  return (
    <FilterToolbar
      search={
        <SearchInput
          aria-label={t("stockReceipts.toolbar.searchLabel")}
          value={search}
          onChange={onSearchChange}
          placeholder={t("stockReceipts.toolbar.searchPlaceholder")}
        />
      }
    >
      <Select
        aria-label={t("stockReceipts.toolbar.statusLabel")}
        value={status}
        onChange={(value) =>
          onStatusChange(value as "all" | StockReceiptStatus)
        }
        options={[
          { value: "all", label: t("stockReceipts.toolbar.allStatuses") },
          ...statuses.map((value) => ({
            value,
            label: t(`stockReceipts.status.${value}`),
          })),
        ]}
      />
    </FilterToolbar>
  );
}
