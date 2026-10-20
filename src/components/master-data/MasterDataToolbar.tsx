import FilterToolbar from "@/components/common/FilterToolbar";
import SearchInput from "@/components/common/SearchInput";
import Select from "@/components/form/Select";
import { useTranslation } from "react-i18next";
import type { MasterDataKind, MasterDataStatus } from "./types";

type MasterDataToolbarProps = {
  kind: MasterDataKind;
  search: string;
  status: MasterDataStatus;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: MasterDataStatus) => void;
};

export default function MasterDataToolbar({
  kind,
  search,
  status,
  onSearchChange,
  onStatusChange,
}: MasterDataToolbarProps) {
  const { t } = useTranslation();

  return (
    <FilterToolbar
      search={
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t(`masterData.${kind}.toolbar.searchPlaceholder`)}
        />
      }
    >
      <Select
        aria-label={t("masterData.common.table.status")}
        value={status}
        options={[
          { value: "all", label: t("masterData.common.toolbar.allStatuses") },
          { value: "active", label: t("masterData.common.status.active") },
          { value: "inactive", label: t("masterData.common.status.inactive") },
        ]}
        onChange={(value) => onStatusChange(value as MasterDataStatus)}
      />
    </FilterToolbar>
  );
}
