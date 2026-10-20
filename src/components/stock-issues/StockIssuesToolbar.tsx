import FilterToolbar from "@/components/common/FilterToolbar";
import SearchInput from "@/components/common/SearchInput";
import Select from "@/components/form/Select";
import { useTranslation } from "react-i18next";
import type { StockIssueStatus } from "./types";

type StockIssuesToolbarProps = {
  search: string;
  status: "all" | StockIssueStatus;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: "all" | StockIssueStatus) => void;
};

const statuses: StockIssueStatus[] = ["DRAFT", "CONFIRMED", "CANCELLED"];

export default function StockIssuesToolbar({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: StockIssuesToolbarProps) {
  const { t } = useTranslation();

  return (
    <FilterToolbar
      search={
        <SearchInput
          aria-label={t("stockIssues.toolbar.searchLabel")}
          value={search}
          onChange={onSearchChange}
          placeholder={t("stockIssues.toolbar.searchPlaceholder")}
        />
      }
    >
      <Select
        aria-label={t("stockIssues.toolbar.statusLabel")}
        value={status}
        onChange={(value) => onStatusChange(value as "all" | StockIssueStatus)}
        options={[
          { value: "all", label: t("stockIssues.toolbar.allStatuses") },
          ...statuses.map((value) => ({
            value,
            label: t(`stockIssues.status.${value}`),
          })),
        ]}
      />
    </FilterToolbar>
  );
}
