import FilterToolbar from "@/components/common/FilterToolbar";
import SearchInput from "@/components/common/SearchInput";
import Select from "@/components/form/Select";
import { useTranslation } from "react-i18next";
import { useMaterialFilterOptions } from "./useMaterialFilterOptions";
import type { MaterialFilterStatus, MaterialLookup } from "./types";

type MaterialsToolbarProps = {
  search: string;
  categoryId: string;
  status: MaterialFilterStatus;
  categories: MaterialLookup[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: MaterialFilterStatus) => void;
};

export default function MaterialsToolbar({
  search,
  categoryId,
  status,
  categories,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: MaterialsToolbarProps) {
  const { t } = useTranslation();
  const { categoryOptions, statusOptions } =
    useMaterialFilterOptions(categories);

  return (
    <FilterToolbar
      search={
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t("materials.toolbar.searchPlaceholder")}
        />
      }
    >
      <Select
        aria-label={t("materials.table.category")}
        value={categoryId}
        options={categoryOptions}
        onChange={onCategoryChange}
      />
      <Select
        aria-label={t("materials.table.status")}
        value={status}
        options={statusOptions}
        onChange={(value) => onStatusChange(value as MaterialFilterStatus)}
      />
    </FilterToolbar>
  );
}
