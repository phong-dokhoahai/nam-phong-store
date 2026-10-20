import FilterToolbar from "@/components/common/FilterToolbar";
import SearchInput from "@/components/common/SearchInput";
import Select from "@/components/form/Select";
import { useMaterialFilterOptions } from "@/components/materials/useMaterialFilterOptions";
import { useTranslation } from "react-i18next";
import type {
  MaterialFilterStatus,
  MaterialLookup,
} from "@/components/materials/types";

type InventoryToolbarProps = {
  search: string;
  categoryId: string;
  status: MaterialFilterStatus;
  categories: MaterialLookup[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: MaterialFilterStatus) => void;
};

export default function InventoryToolbar({
  search,
  categoryId,
  status,
  categories,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: InventoryToolbarProps) {
  const { t } = useTranslation();
  const { categoryOptions, statusOptions } =
    useMaterialFilterOptions(categories);

  return (
    <FilterToolbar
      search={
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t("inventory.toolbar.searchPlaceholder")}
          aria-label={t("inventory.toolbar.searchLabel")}
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
