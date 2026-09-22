export type MaterialSource = "supabase" | "demo";

export type MaterialLookup = {
  id: string;
  code: string;
  name: string;
};

export type Material = {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unitId: string;
  unitName: string;
  description: string;
  defaultPurchasePrice: number;
  defaultSalePrice: number;
  minimumStock: number;
  currentStock: number;
  isActive: boolean;
  updatedAt: string;
};

export type MaterialFormValues = {
  sku: string;
  name: string;
  categoryId: string;
  unitId: string;
  description: string;
  defaultPurchasePrice: number;
  defaultSalePrice: number;
  minimumStock: number;
  isActive: boolean;
};

export type MaterialStockStatus =
  | "active"
  | "inactive"
  | "lowStock"
  | "outOfStock";

export type MaterialFilterStatus = "all" | MaterialStockStatus;
