import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { demoCategories, demoMaterials, demoUnits } from "./materialsFixtures";
import type {
  Material,
  MaterialFormValues,
  MaterialLookup,
  MaterialSource,
} from "./types";

type MaterialRow = {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  unit_id: string;
  description: string | null;
  default_purchase_price: number | string | null;
  default_sale_price: number | string | null;
  minimum_stock: number | string | null;
  current_stock: number | string | null;
  is_active: boolean;
  updated_at: string;
  categories?: MaterialLookup | MaterialLookup[] | null;
  units?: MaterialLookup | MaterialLookup[] | null;
};

type MaterialsPayload = {
  source: MaterialSource;
  materials: Material[];
  categories: MaterialLookup[];
  units: MaterialLookup[];
};

const readLookup = (
  value: MaterialLookup | MaterialLookup[] | null | undefined,
): MaterialLookup | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
};

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
};

const toMaterial = (row: MaterialRow): Material => {
  const category = readLookup(row.categories);
  const unit = readLookup(row.units);

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    categoryId: row.category_id,
    categoryName: category?.name || "",
    unitId: row.unit_id,
    unitName: unit?.name || "",
    description: row.description || "",
    defaultPurchasePrice: toNumber(row.default_purchase_price),
    defaultSalePrice: toNumber(row.default_sale_price),
    minimumStock: toNumber(row.minimum_stock),
    currentStock: toNumber(row.current_stock),
    isActive: row.is_active,
    updatedAt: row.updated_at,
  };
};

const materialSelect = `
  id,
  sku,
  name,
  category_id,
  unit_id,
  description,
  default_purchase_price,
  default_sale_price,
  minimum_stock,
  current_stock,
  is_active,
  updated_at,
  categories ( id, code, name ),
  units ( id, code, name )
`;

export const isMaterialsBackendAvailable = () =>
  isSupabaseConfigured && Boolean(supabase);

export const fetchMaterialsPayload = async (): Promise<MaterialsPayload> => {
  if (!isMaterialsBackendAvailable() || !supabase) {
    return {
      source: "demo",
      materials: demoMaterials,
      categories: demoCategories,
      units: demoUnits,
    };
  }

  const [categoriesResult, unitsResult, materialsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, code, name")
      .order("name", { ascending: true }),
    supabase.from("units").select("id, code, name").order("name", {
      ascending: true,
    }),
    supabase
      .from("materials")
      .select(materialSelect)
      .order("updated_at", { ascending: false }),
  ]);

  if (categoriesResult.error || unitsResult.error || materialsResult.error) {
    throw new Error(
      categoriesResult.error?.message ||
        unitsResult.error?.message ||
        materialsResult.error?.message ||
        "Unable to load materials.",
    );
  }

  return {
    source: "supabase",
    categories: (categoriesResult.data || []) as MaterialLookup[],
    units: (unitsResult.data || []) as MaterialLookup[],
    materials: ((materialsResult.data || []) as MaterialRow[]).map(toMaterial),
  };
};

const toUpsertPayload = (values: MaterialFormValues) => ({
  sku: values.sku.trim().toUpperCase(),
  name: values.name.trim(),
  category_id: values.categoryId,
  unit_id: values.unitId,
  description: values.description.trim() || null,
  default_purchase_price: values.defaultPurchasePrice,
  default_sale_price: values.defaultSalePrice,
  minimum_stock: values.minimumStock,
  is_active: values.isActive,
});

export const createMaterial = async (values: MaterialFormValues) => {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("materials")
    .insert(toUpsertPayload(values))
    .select(materialSelect)
    .single();

  if (error) throw new Error(error.message);
  return toMaterial(data as MaterialRow);
};

export const updateMaterial = async (
  id: string,
  values: MaterialFormValues,
) => {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("materials")
    .update(toUpsertPayload(values))
    .eq("id", id)
    .select(materialSelect)
    .single();

  if (error) throw new Error(error.message);
  return toMaterial(data as MaterialRow);
};

export const deactivateMaterial = async (id: string) => {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("materials")
    .update({ is_active: false })
    .eq("id", id)
    .select(materialSelect)
    .single();

  if (error) throw new Error(error.message);
  return toMaterial(data as MaterialRow);
};
