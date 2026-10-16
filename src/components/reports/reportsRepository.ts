import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type {
  DailySalesRow,
  DebtPeriodRow,
  DebtReportKind,
  InventoryPeriodRow,
  LowStockRow,
} from "./types";

type LowStockDbRow = {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  category_name: string;
  unit_name: string;
  minimum_stock: number | string;
  current_stock: number | string;
  shortage_quantity: number | string;
  is_out_of_stock: boolean;
};

// PostgREST caps each response (1000 rows by default); page until exhausted
// so reports are never silently truncated.
const PAGE_SIZE = 1000;

export const fetchAllRows = async <T>(
  query: (from: number, to: number) => PromiseLike<{
    data: unknown[] | null;
    error: { message: string } | null;
  }>,
): Promise<T[]> => {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await query(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data || []) as T[]));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
};

export const fetchLowStockReport = async (): Promise<LowStockRow[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  const client = supabase;

  const data = await fetchAllRows<LowStockDbRow>((from, to) =>
    client
      .from("v_low_stock_materials")
      .select("*")
      .order("shortage_quantity", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to),
  );

  return data.map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    unitName: row.unit_name,
    minimumStock: Number(row.minimum_stock),
    currentStock: Number(row.current_stock),
    shortageQuantity: Number(row.shortage_quantity),
    isOutOfStock: row.is_out_of_stock,
  }));
};

type DailySalesDbRow = {
  summary_date: string;
  order_count: number | string;
  subtotal: number | string;
  discount_amount: number | string;
  shipping_and_tax: number | string;
  total_amount: number | string;
  return_count: number | string;
  return_amount: number | string;
  net_revenue: number | string;
};

export const fetchDailySales = async (
  from: string,
  to: string,
): Promise<DailySalesRow[]> => {
  if (!isSupabaseConfigured || !supabase) return [];

  const client = supabase;

  const data = await fetchAllRows<DailySalesDbRow>((start, end) =>
    client
      .from("v_daily_sales_summary")
      .select("*")
      .gte("summary_date", from)
      .lte("summary_date", to)
      .order("summary_date", { ascending: true })
      .range(start, end),
  );

  return data.map((row) => ({
    date: row.summary_date,
    orderCount: Number(row.order_count),
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discount_amount),
    shippingAndTax: Number(row.shipping_and_tax),
    totalAmount: Number(row.total_amount),
    returnCount: Number(row.return_count),
    returnAmount: Number(row.return_amount),
    netRevenue: Number(row.net_revenue),
  }));
};

type InventoryPeriodDbRow = {
  material_id: string;
  sku: string;
  name: string;
  category_id: string;
  category_name: string;
  unit_name: string;
  is_active: boolean;
  opening_quantity: number | string;
  import_quantity: number | string;
  customer_return_quantity: number | string;
  adjustment_in_quantity: number | string;
  export_quantity: number | string;
  supplier_return_quantity: number | string;
  adjustment_out_quantity: number | string;
  closing_quantity: number | string;
  current_stock: number | string;
};

export const fetchInventoryPeriod = async (
  from: string,
  to: string,
  categoryId: string,
): Promise<InventoryPeriodRow[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  const client = supabase;

  const data = await fetchAllRows<InventoryPeriodDbRow>((start, end) =>
    client
      .rpc("report_inventory_period", {
        p_from: from,
        p_to: to,
        p_category_id: categoryId || null,
      })
      .range(start, end),
  );

  return data.map((row) => ({
    materialId: row.material_id,
    sku: row.sku,
    name: row.name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    unitName: row.unit_name,
    isActive: row.is_active,
    opening: Number(row.opening_quantity),
    importQuantity: Number(row.import_quantity),
    customerReturnQuantity: Number(row.customer_return_quantity),
    adjustmentInQuantity: Number(row.adjustment_in_quantity),
    exportQuantity: Number(row.export_quantity),
    supplierReturnQuantity: Number(row.supplier_return_quantity),
    adjustmentOutQuantity: Number(row.adjustment_out_quantity),
    closing: Number(row.closing_quantity),
    currentStock: Number(row.current_stock),
  }));
};

export const fetchCategories = async () => {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({ id: row.id as string, label: row.name as string }));
};

type DebtPeriodDbRow = {
  party_id: string;
  party_code: string;
  party_name: string;
  opening_debt: number | string;
  debt_increase: number | string;
  payment_amount: number | string;
  return_adjustment: number | string;
  other_adjustment: number | string;
  closing_debt: number | string;
};

export const fetchDebtPeriod = async (
  kind: DebtReportKind,
  from: string,
  to: string,
): Promise<DebtPeriodRow[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  const client = supabase;

  const data = await fetchAllRows<DebtPeriodDbRow>((start, end) =>
    client
      .rpc("report_debt_period", {
        p_direction: kind === "customer" ? "RECEIVABLE" : "PAYABLE",
        p_from: from,
        p_to: to,
      })
      .range(start, end),
  );

  return data.map((row) => ({
    partyId: row.party_id,
    partyCode: row.party_code,
    partyName: row.party_name,
    openingDebt: Number(row.opening_debt),
    debtIncrease: Number(row.debt_increase),
    payment: Number(row.payment_amount),
    returnAdjustment: Number(row.return_adjustment),
    otherAdjustment: Number(row.other_adjustment),
    closingDebt: Number(row.closing_debt),
  }));
};
