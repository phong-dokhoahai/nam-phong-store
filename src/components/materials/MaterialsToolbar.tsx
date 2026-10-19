import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { PlusIcon, SearchIcon } from "@/icons";
import { useTranslation } from "react-i18next";
import type {
  MaterialFilterStatus,
  MaterialLookup,
  MaterialSource,
} from "./types";

type MaterialsToolbarProps = {
  search: string;
  categoryId: string;
  status: MaterialFilterStatus;
  categories: MaterialLookup[];
  source: MaterialSource;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: MaterialFilterStatus) => void;
  onCreate: () => void;
};

export default function MaterialsToolbar({
  search,
  categoryId,
  status,
  categories,
  source,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onCreate,
}: MaterialsToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
        <div className="relative">
          <SearchIcon className="absolute inset-s-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("materials.toolbar.searchPlaceholder")}
            className="ps-10"
          />
        </div>
        <Select
          value={categoryId}
          placeholder={t("materials.toolbar.allCategories")}
          options={[
            { value: "all", label: t("materials.toolbar.allCategories") },
            ...categories.map((category) => ({
              value: category.id,
              label: category.name,
            })),
          ]}
          onChange={onCategoryChange}
        />
        <Select
          value={status}
          placeholder={t("materials.toolbar.allStatuses")}
          options={[
            { value: "all", label: t("materials.toolbar.allStatuses") },
            { value: "active", label: t("materials.status.active") },
            { value: "lowStock", label: t("materials.status.lowStock") },
            { value: "outOfStock", label: t("materials.status.outOfStock") },
            { value: "inactive", label: t("materials.status.inactive") },
          ]}
          onChange={(value) => onStatusChange(value as MaterialFilterStatus)}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {source === "supabase"
            ? t("materials.toolbar.liveSource")
            : t("materials.toolbar.demoSource")}
        </span>
        <Button startIcon={<PlusIcon className="size-5" />} onClick={onCreate}>
          {t("materials.actions.add")}
        </Button>
      </div>
    </div>
  );
}
