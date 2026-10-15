import type { Material, MaterialStockStatus } from "./types";

export const getMaterialStatus = (
  material: Material,
): MaterialStockStatus => {
  if (!material.isActive) return "inactive";
  if (material.currentStock === 0) return "outOfStock";
  if (material.currentStock <= material.minimumStock) return "lowStock";
  return "active";
};

export const formatQuantity = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(value);
