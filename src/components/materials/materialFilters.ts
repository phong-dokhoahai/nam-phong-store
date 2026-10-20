import { getMaterialStatus } from "./materialStatus";
import type { Material, MaterialFilterStatus } from "./types";

export type MaterialFilters = {
  search: string;
  categoryId: string;
  status: MaterialFilterStatus;
};

/** Name/SKU search + category + stock status, used by Materials and Inventory. */
export const filterMaterials = (
  materials: Material[],
  { search, categoryId, status }: MaterialFilters,
) => {
  const normalizedSearch = search.trim().toLowerCase();

  return materials.filter((material) => {
    const matchesSearch =
      !normalizedSearch ||
      material.name.toLowerCase().includes(normalizedSearch) ||
      material.sku.toLowerCase().includes(normalizedSearch);
    const matchesCategory =
      categoryId === "all" || material.categoryId === categoryId;
    const matchesStatus =
      status === "all" || getMaterialStatus(material) === status;

    return matchesSearch && matchesCategory && matchesStatus;
  });
};
