import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import {
  demoStockIssueCustomers,
  demoStockIssueMaterials,
  demoStockIssues,
} from "./StockIssuesFixtures";
import { calculateIssueTotal, calculateSubtotal } from "./StockIssueFormat";
import type {
  StockIssue,
  StockIssueCustomerLookup,
  StockIssueDraftValues,
  StockIssueLine,
  StockIssueMaterialLookup,
  StockIssuePayload,
  StockIssueSource,
} from "./types";

type CustomerRelation =
  | StockIssueCustomerLookup
  | StockIssueCustomerLookup[]
  | null;

type MaterialRelation =
  | {
      id: string;
      sku: string;
      name: string;
      current_stock: number | string | null;
      default_sale_price: number | string | null;
      units?: { name: string } | { name: string }[] | null;
    }
  | {
      id: string;
      sku: string;
      name: string;
      current_stock: number | string | null;
      default_sale_price: number | string | null;
      units?: { name: string } | { name: string }[] | null;
    }[]
  | null;

type IssueRow = {
  id: string;
  code: string;
  customer_id: string;
  sale_date: string;
  status: StockIssue["status"];
  subtotal: number | string | null;
  discount_amount: number | string | null;
  shipping_fee: number | string | null;
  tax_amount: number | string | null;
  total_amount: number | string | null;
  paid_amount: number | string | null;
  debt_amount: number | string | null;
  payment_status: StockIssue["paymentStatus"];
  delivery_address: string | null;
  note: string | null;
  updated_at: string;
  customers?: CustomerRelation;
  sales_order_items?: ItemRow[];
};

type ItemRow = {
  id: string;
  material_id: string;
  material_sku_snapshot: string | null;
  material_name_snapshot: string | null;
  unit_name_snapshot: string | null;
  quantity: number | string;
  unit_price: number | string;
  discount_amount: number | string | null;
  line_total: number | string;
  materials?: MaterialRelation;
};

const issueSelect = `
  id,
  code,
  customer_id,
  sale_date,
  status,
  subtotal,
  discount_amount,
  shipping_fee,
  tax_amount,
  total_amount,
  paid_amount,
  debt_amount,
  payment_status,
  delivery_address,
  note,
  updated_at,
  customers ( id, code, name ),
  sales_order_items (
    id,
    material_id,
    material_sku_snapshot,
    material_name_snapshot,
    unit_name_snapshot,
    quantity,
    unit_price,
    discount_amount,
    line_total,
    materials ( id, sku, name, current_stock, default_sale_price, units ( name ) )
  )
`;

const materialSelect = `
  id,
  sku,
  name,
  current_stock,
  default_sale_price,
  units ( name )
`;

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
};

const readOne = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
};

const toLine = (row: ItemRow): StockIssueLine => {
  const material = readOne(row.materials);
  const unit = readOne(material?.units);

  return {
    id: row.id,
    materialId: row.material_id,
    materialSku: row.material_sku_snapshot || material?.sku || "",
    materialName: row.material_name_snapshot || material?.name || "",
    unitName: row.unit_name_snapshot || unit?.name || "",
    quantity: toNumber(row.quantity),
    unitPrice: toNumber(row.unit_price),
    discountAmount: toNumber(row.discount_amount),
    lineTotal: toNumber(row.line_total),
  };
};

const toIssue = (row: IssueRow): StockIssue => {
  const customer = readOne(row.customers);

  return {
    id: row.id,
    code: row.code,
    customerId: row.customer_id,
    customerName: customer?.name || "",
    issueDate: row.sale_date,
    status: row.status,
    subtotal: toNumber(row.subtotal),
    discountAmount: toNumber(row.discount_amount),
    shippingFee: toNumber(row.shipping_fee),
    taxAmount: toNumber(row.tax_amount),
    totalAmount: toNumber(row.total_amount),
    paidAmount: toNumber(row.paid_amount),
    debtAmount: toNumber(row.debt_amount),
    paymentStatus: row.payment_status,
    deliveryAddress: row.delivery_address || "",
    note: row.note || "",
    updatedAt: row.updated_at,
    lines: (row.sales_order_items || []).map(toLine),
  };
};

const toMaterialLookup = (row: {
  id: string;
  sku: string;
  name: string;
  current_stock: number | string | null;
  default_sale_price: number | string | null;
  units?: { name: string } | { name: string }[] | null;
}): StockIssueMaterialLookup => ({
  id: row.id,
  sku: row.sku,
  name: row.name,
  unitName: readOne(row.units)?.name || "",
  currentStock: toNumber(row.current_stock),
  defaultSalePrice: toNumber(row.default_sale_price),
});

const createDemoId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const isStockIssuesBackendAvailable = () =>
  isSupabaseConfigured && Boolean(supabase);

export const fetchStockIssuesPayload =
  async (): Promise<StockIssuePayload> => {
    if (!isStockIssuesBackendAvailable() || !supabase) {
      return {
        source: "demo",
        issues: demoStockIssues,
        customers: demoStockIssueCustomers,
        materials: demoStockIssueMaterials,
      };
    }

    const [customersResult, materialsResult, issuesResult] = await Promise.all([
      supabase
        .from("customers")
        .select("id, code, name")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("materials")
        .select(materialSelect)
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("sales_orders")
        .select(issueSelect)
        .order("updated_at", { ascending: false }),
    ]);

    if (customersResult.error || materialsResult.error || issuesResult.error) {
      throw new Error(
        customersResult.error?.message ||
          materialsResult.error?.message ||
          issuesResult.error?.message ||
          "Unable to load stock issues.",
      );
    }

    return {
      source: "supabase",
      customers: (customersResult.data || []) as StockIssueCustomerLookup[],
      materials: (
        (materialsResult.data || []) as Parameters<typeof toMaterialLookup>[0][]
      ).map(toMaterialLookup),
      issues: ((issuesResult.data || []) as IssueRow[]).map(toIssue),
    };
  };

const toIssuePayload = (values: StockIssueDraftValues, code?: string) => {
  const subtotal = calculateSubtotal(values.lines);
  const totalAmount = calculateIssueTotal(
    subtotal,
    values.discountAmount,
    values.shippingFee,
    values.taxAmount,
  );

  return {
    ...(code ? { code } : {}),
    customer_id: values.customerId,
    sale_date: values.issueDate,
    subtotal,
    discount_amount: values.discountAmount,
    shipping_fee: values.shippingFee,
    tax_amount: values.taxAmount,
    total_amount: totalAmount,
    paid_amount: 0,
    debt_amount: totalAmount,
    payment_status: "UNPAID" as const,
    delivery_address: values.deliveryAddress.trim() || null,
    note: values.note.trim() || null,
  };
};

const toItemPayload = (issueId: string, line: StockIssueLine) => ({
  sales_order_id: issueId,
  material_id: line.materialId,
  quantity: line.quantity,
  unit_price: line.unitPrice,
  discount_amount: line.discountAmount,
  line_total: line.lineTotal,
});

const fetchIssueById = async (issueId: string) => {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("sales_orders")
    .select(issueSelect)
    .eq("id", issueId)
    .single();

  if (error) throw new Error(error.message);
  return toIssue(data as IssueRow);
};

export const createStockIssue = async (
  values: StockIssueDraftValues,
): Promise<StockIssue> => {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: code, error: codeError } = await supabase.rpc(
    "next_document_code",
    {
      document_type: "BH",
      document_date: values.issueDate,
    },
  );

  if (codeError) throw new Error(codeError.message);

  const { data: issue, error: issueError } = await supabase
    .from("sales_orders")
    .insert(toIssuePayload(values, String(code)))
    .select("id")
    .single();

  if (issueError) throw new Error(issueError.message);

  const issueId = String((issue as { id: string }).id);

  if (values.lines.length > 0) {
    const { error: itemsError } = await supabase
      .from("sales_order_items")
      .insert(values.lines.map((line) => toItemPayload(issueId, line)));

    if (itemsError) {
      await supabase
        .from("sales_orders")
        .delete()
        .eq("id", issueId)
        .eq("status", "DRAFT");
      throw new Error(itemsError.message);
    }
  }

  return fetchIssueById(issueId);
};

export const updateStockIssue = async (
  issueId: string,
  values: StockIssueDraftValues,
): Promise<StockIssue> => {
  if (!supabase) throw new Error("Supabase is not configured.");

  const replacementIssue = await createStockIssue(values);

  const { error: deleteError } = await supabase
    .from("sales_orders")
    .delete()
    .eq("id", issueId)
    .eq("status", "DRAFT");

  if (deleteError) {
    await supabase
      .from("sales_orders")
      .delete()
      .eq("id", replacementIssue.id)
      .eq("status", "DRAFT");
    throw new Error(deleteError.message);
  }

  return replacementIssue;
};

export const confirmStockIssue = async (
  issueId: string,
): Promise<StockIssue> => {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.rpc("confirm_sales_order", {
    order_id: issueId,
  });

  if (error) throw new Error(error.message);
  return fetchIssueById(issueId);
};

export const createDemoStockIssue = (
  values: StockIssueDraftValues,
  customers: StockIssueCustomerLookup[],
  existing?: StockIssue,
): StockIssue => {
  const subtotal = calculateSubtotal(values.lines);
  const totalAmount = calculateIssueTotal(
    subtotal,
    values.discountAmount,
    values.shippingFee,
    values.taxAmount,
  );
  const customer = customers.find((item) => item.id === values.customerId);

  return {
    id: existing?.id || createDemoId("issue-demo"),
    code: existing?.code || `BH-DEMO-${Date.now().toString().slice(-4)}`,
    customerId: values.customerId,
    customerName: customer?.name || "",
    issueDate: values.issueDate,
    status: existing?.status || "DRAFT",
    subtotal,
    discountAmount: values.discountAmount,
    shippingFee: values.shippingFee,
    taxAmount: values.taxAmount,
    totalAmount,
    paidAmount: 0,
    debtAmount: totalAmount,
    paymentStatus: "UNPAID",
    deliveryAddress: values.deliveryAddress.trim(),
    note: values.note.trim(),
    updatedAt: new Date().toISOString(),
    lines: values.lines,
  };
};

export const confirmDemoStockIssue = (issue: StockIssue): StockIssue => ({
  ...issue,
  status: "CONFIRMED",
  paidAmount: 0,
  debtAmount: issue.totalAmount,
  paymentStatus: "UNPAID",
  updatedAt: new Date().toISOString(),
});

export const getEmptyDraftValues = (): StockIssueDraftValues => ({
  customerId: "",
  issueDate: new Date().toISOString().slice(0, 10),
  deliveryAddress: "",
  discountAmount: 0,
  shippingFee: 0,
  taxAmount: 0,
  note: "",
  lines: [],
});

export const getSourceLabelKey = (source: StockIssueSource) =>
  source === "supabase"
    ? "stockIssues.toolbar.liveSource"
    : "stockIssues.toolbar.demoSource";
