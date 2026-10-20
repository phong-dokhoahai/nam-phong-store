import type { SelectOption } from "@/components/form/Select";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { MaterialLookup, MaterialStockStatus } from "./types";

const filterStatuses: MaterialStockStatus[] = [
  "active",
  "lowStock",
  "outOfStock",
  "inactive",
];

/** Category + stock-status filter options shared by Materials and Inventory. */
export function useMaterialFilterOptions(categories: MaterialLookup[]) {
  const { t } = useTranslation();

  return useMemo(() => {
    const categoryOptions: SelectOption[] = [
      { value: "all", label: t("materials.toolbar.allCategories") },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ];
    const statusOptions: SelectOption[] = [
      { value: "all", label: t("materials.toolbar.allStatuses") },
      ...filterStatuses.map((status) => ({
        value: status,
        label: t(`materials.status.${status}`),
      })),
    ];

    return { categoryOptions, statusOptions };
  }, [categories, t]);
}
