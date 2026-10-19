import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { SearchIcon } from "@/icons";
import { useTranslation } from "react-i18next";
import type {
  MaterialFilterStatus,
  MaterialLookup,
  MaterialSource,
} from "@/components/materials/types";

type InventoryToolbarProps = {
  search: string;
  categoryId: string;
  status: MaterialFilterStatus;
  categories: MaterialLookup[];
  source: MaterialSource;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: MaterialFilterStatus) => void;
};

export default function InventoryToolbar({
  search,
  categoryId,
  status,
  categories,
  source,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: InventoryToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
        <div className="relative">
          <SearchIcon className="absolute inset-s-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("inventory.toolbar.searchPlaceholder")}
            aria-label={t("inventory.toolbar.searchLabel")}
            className="ps-10"
          />
        </div>
        <Select
          value={categoryId}
          placeholder={t("inventory.toolbar.allCategories")}
          options={[
            { value: "all", label: t("inventory.toolbar.allCategories") },
            ...categories.map((category) => ({
              value: category.id,
              label: category.name,
            })),
          ]}
          onChange={onCategoryChange}
        />
        <Select
          value={status}
          placeholder={t("inventory.toolbar.allStatuses")}
          options={[
            { value: "all", label: t("inventory.toolbar.allStatuses") },
            { value: "active", label: t("materials.status.active") },
            { value: "lowStock", label: t("materials.status.lowStock") },
            { value: "outOfStock", label: t("materials.status.outOfStock") },
            { value: "inactive", label: t("materials.status.inactive") },
          ]}
          onChange={(value) => onStatusChange(value as MaterialFilterStatus)}
        />
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {source === "supabase"
          ? t("inventory.toolbar.liveSource")
          : t("inventory.toolbar.demoSource")}
      </span>
    </div>
  );
}
