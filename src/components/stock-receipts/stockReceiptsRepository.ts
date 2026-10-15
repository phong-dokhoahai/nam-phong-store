import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import {
  demoStockReceiptMaterials,
  demoStockReceipts,
  demoStockReceiptSuppliers,
} from "./stockReceiptsFixtures";
import { calculateReceiptTotal, calculateSubtotal } from "./stockReceiptFormat";
import type {
  StockReceipt,
  StockReceiptDraftValues,
  StockReceiptLine,
  StockReceiptMaterialLookup,
  StockReceiptPayload,
  StockReceiptSource,
  StockReceiptSupplierLookup,
} from "./types";

type SupplierRelation =
  StockReceiptSupplierLookup | StockReceiptSupplierLookup[] | null;

type MaterialRelation =
  | {
      id: string;
      sku: string;
      name: string;
      current_stock: number | string | null;
      default_purchase_price: number | string | null;
      units?: { name: string } | { name: string }[] | null;
    }
  | {
      id: string;
      sku: string;
      name: string;
      current_stock: number | string | null;
      default_purchase_price: number | string | null;
      units?: { name: string } | { name: string }[] | null;
    }[]
  | null;

type ReceiptRow = {
  id: string;
  code: string;
  supplier_id: string;
  receipt_date: string;
  status: StockReceipt["status"];
  subtotal: number | string | null;
  discount_amount: number | string | null;
  shipping_fee: number | string | null;
  tax_amount: number | string | null;
  total_amount: number | string | null;
  paid_amount: number | string | null;
  debt_amount: number | string | null;
  payment_status: StockReceipt["paymentStatus"];
  supplier_invoice_number: string | null;
  note: string | null;
  updated_at: string;
  suppliers?: SupplierRelation;
  purchase_receipt_items?: ItemRow[];
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

const receiptSelect = `
  id,
  code,
  supplier_id,
  receipt_date,
  status,
  subtotal,
  discount_amount,
  shipping_fee,
  tax_amount,
  total_amount,
  paid_amount,
  debt_amount,
  payment_status,
  supplier_invoice_number,
  note,
  updated_at,
  suppliers ( id, code, name ),
  purchase_receipt_items (
    id,
    material_id,
    material_sku_snapshot,
    material_name_snapshot,
    unit_name_snapshot,
    quantity,
    unit_price,
    discount_amount,
    line_total,
    materials ( id, sku, name, current_stock, default_purchase_price, units ( name ) )
  )
`;

const materialSelect = `
  id,
  sku,
  name,
  current_stock,
  default_purchase_price,
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

const toLine = (row: ItemRow): StockReceiptLine => {
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

const toReceipt = (row: ReceiptRow): StockReceipt => {
  const supplier = readOne(row.suppliers);

  return {
    id: row.id,
    code: row.code,
    supplierId: row.supplier_id,
    supplierName: supplier?.name || "",
    receiptDate: row.receipt_date,
    status: row.status,
    subtotal: toNumber(row.subtotal),
    discountAmount: toNumber(row.discount_amount),
    shippingFee: toNumber(row.shipping_fee),
    taxAmount: toNumber(row.tax_amount),
    totalAmount: toNumber(row.total_amount),
    paidAmount: toNumber(row.paid_amount),
    debtAmount: toNumber(row.debt_amount),
    paymentStatus: row.payment_status,
    supplierInvoiceNumber: row.supplier_invoice_number || "",
    note: row.note || "",
    updatedAt: row.updated_at,
    lines: (row.purchase_receipt_items || []).map(toLine),
  };
};

const toMaterialLookup = (row: {
  id: string;
  sku: string;
  name: string;
  current_stock: number | string | null;
  default_purchase_price: number | string | null;
  units?: { name: string } | { name: string }[] | null;
}): StockReceiptMaterialLookup => ({
  id: row.id,
  sku: row.sku,
  name: row.name,
  unitName: readOne(row.units)?.name || "",
  currentStock: toNumber(row.current_stock),
  defaultPurchasePrice: toNumber(row.default_purchase_price),
});

const createDemoId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const isStockReceiptsBackendAvailable = () =>
  isSupabaseConfigured && Boolean(supabase);

export const fetchStockReceiptsPayload = async (options: {
  page: number;
  pageSize: number;
  search: string;
  status: "all" | StockReceipt["status"];
}): Promise<StockReceiptPayload> => {
    if (!isStockReceiptsBackendAvailable() || !supabase) {
      return {
        source: "demo",
        receipts: demoStockReceipts,
        totalCount: demoStockReceipts.length,
        suppliers: demoStockReceiptSuppliers,
        materials: demoStockReceiptMaterials,
      };
    }

    const offset = (options.page - 1) * options.pageSize;
    let receiptsQuery = supabase
      .from("purchase_receipts")
      .select(receiptSelect, { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(offset, offset + options.pageSize - 1);

    if (options.status !== "all") {
      receiptsQuery = receiptsQuery.eq("status", options.status);
    }
    const search = options.search
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .replace(/\s+/g, " ");
    if (search) {
      const pattern = `*${search}*`;
      const { data: matchingSuppliers, error: supplierSearchError } =
        await supabase
          .from("suppliers")
          .select("id")
          .ilike("name", pattern);
      if (supplierSearchError) throw new Error(supplierSearchError.message);

      const filters = [
        `code.ilike.${pattern}`,
        `supplier_invoice_number.ilike.${pattern}`,
      ];
      if (matchingSuppliers?.length) {
        filters.push(
          `supplier_id.in.(${matchingSuppliers.map(({ id }) => id).join(",")})`,
        );
      }
      receiptsQuery = receiptsQuery.or(
        filters.join(","),
      );
    }

    const [suppliersResult, materialsResult, receiptsResult] =
      await Promise.all([
        supabase
          .from("suppliers")
          .select("id, code, name")
          .eq("is_active", true)
          .order("name", { ascending: true }),
        supabase
          .from("materials")
          .select(materialSelect)
          .eq("is_active", true)
          .order("name", { ascending: true }),
        receiptsQuery,
      ]);

    if (
      suppliersResult.error ||
      materialsResult.error ||
      receiptsResult.error
    ) {
      throw new Error(
        suppliersResult.error?.message ||
          materialsResult.error?.message ||
          receiptsResult.error?.message ||
          "Unable to load stock receipts.",
      );
    }

    return {
      source: "supabase",
      totalCount: receiptsResult.count || 0,
      suppliers: (suppliersResult.data || []) as StockReceiptSupplierLookup[],
      materials: (
        (materialsResult.data || []) as Parameters<typeof toMaterialLookup>[0][]
      ).map(toMaterialLookup),
      receipts: ((receiptsResult.data || []) as ReceiptRow[]).map(toReceipt),
    };
  };

const toReceiptPayload = (values: StockReceiptDraftValues, code?: string) => {
  const subtotal = calculateSubtotal(values.lines);
  const totalAmount = calculateReceiptTotal(
    subtotal,
    values.discountAmount,
    values.shippingFee,
    values.taxAmount,
  );

  return {
    ...(code ? { code } : {}),
    supplier_id: values.supplierId,
    receipt_date: values.receiptDate,
    subtotal,
    discount_amount: values.discountAmount,
    shipping_fee: values.shippingFee,
    tax_amount: values.taxAmount,
    total_amount: totalAmount,
    paid_amount: 0,
    debt_amount: totalAmount,
    payment_status: "UNPAID" as const,
    supplier_invoice_number: values.supplierInvoiceNumber.trim() || null,
    note: values.note.trim() || null,
  };
};

const toItemPayload = (receiptId: string, line: StockReceiptLine) => ({
  purchase_receipt_id: receiptId,
  material_id: line.materialId,
  quantity: line.quantity,
  unit_price: line.unitPrice,
  discount_amount: line.discountAmount,
  line_total: line.lineTotal,
});

const fetchReceiptById = async (receiptId: string) => {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("purchase_receipts")
    .select(receiptSelect)
    .eq("id", receiptId)
    .single();

  if (error) throw new Error(error.message);
  return toReceipt(data as ReceiptRow);
};

export const createStockReceipt = async (
  values: StockReceiptDraftValues,
): Promise<StockReceipt> => {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: code, error: codeError } = await supabase.rpc(
    "next_document_code",
    {
      document_type: "PN",
      document_date: values.receiptDate,
    },
  );

  if (codeError) throw new Error(codeError.message);

  const { data: receipt, error: receiptError } = await supabase
    .from("purchase_receipts")
    .insert(toReceiptPayload(values, String(code)))
    .select("id")
    .single();

  if (receiptError) throw new Error(receiptError.message);

  const receiptId = String((receipt as { id: string }).id);

  if (values.lines.length > 0) {
    const { error: itemsError } = await supabase
      .from("purchase_receipt_items")
      .insert(values.lines.map((line) => toItemPayload(receiptId, line)));

    if (itemsError) {
      await supabase
        .from("purchase_receipts")
        .delete()
        .eq("id", receiptId)
        .eq("status", "DRAFT");
      throw new Error(itemsError.message);
    }
  }

  return fetchReceiptById(receiptId);
};

export const updateStockReceipt = async (
  receiptId: string,
  values: StockReceiptDraftValues,
): Promise<StockReceipt> => {
  if (!supabase) throw new Error("Supabase is not configured.");

  const replacementReceipt = await createStockReceipt(values);

  const { error: deleteError } = await supabase
    .from("purchase_receipts")
    .delete()
    .eq("id", receiptId)
    .eq("status", "DRAFT");

  if (deleteError) {
    await supabase
      .from("purchase_receipts")
      .delete()
      .eq("id", replacementReceipt.id)
      .eq("status", "DRAFT");
    throw new Error(deleteError.message);
  }

  return replacementReceipt;
};

export const confirmStockReceipt = async (
  receiptId: string,
): Promise<StockReceipt> => {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.rpc("confirm_purchase_receipt", {
    receipt_id: receiptId,
  });

  if (error) throw new Error(error.message);
  return fetchReceiptById(receiptId);
};

export const createDemoStockReceipt = (
  values: StockReceiptDraftValues,
  suppliers: StockReceiptSupplierLookup[],
  existing?: StockReceipt,
): StockReceipt => {
  const subtotal = calculateSubtotal(values.lines);
  const totalAmount = calculateReceiptTotal(
    subtotal,
    values.discountAmount,
    values.shippingFee,
    values.taxAmount,
  );
  const supplier = suppliers.find((item) => item.id === values.supplierId);

  return {
    id: existing?.id || createDemoId("receipt-demo"),
    code: existing?.code || `PN-DEMO-${Date.now().toString().slice(-4)}`,
    supplierId: values.supplierId,
    supplierName: supplier?.name || "",
    receiptDate: values.receiptDate,
    status: existing?.status || "DRAFT",
    subtotal,
    discountAmount: values.discountAmount,
    shippingFee: values.shippingFee,
    taxAmount: values.taxAmount,
    totalAmount,
    paidAmount: 0,
    debtAmount: totalAmount,
    paymentStatus: "UNPAID",
    supplierInvoiceNumber: values.supplierInvoiceNumber.trim(),
    note: values.note.trim(),
    updatedAt: new Date().toISOString(),
    lines: values.lines,
  };
};

export const confirmDemoStockReceipt = (
  receipt: StockReceipt,
): StockReceipt => ({
  ...receipt,
  status: "CONFIRMED",
  paidAmount: 0,
  debtAmount: receipt.totalAmount,
  paymentStatus: "UNPAID",
  updatedAt: new Date().toISOString(),
});

export const getEmptyDraftValues = (): StockReceiptDraftValues => ({
  supplierId: "",
  receiptDate: new Date().toISOString().slice(0, 10),
  supplierInvoiceNumber: "",
  discountAmount: 0,
  shippingFee: 0,
  taxAmount: 0,
  note: "",
  lines: [],
});

export const getSourceLabelKey = (source: StockReceiptSource) =>
  source === "supabase"
    ? "stockReceipts.toolbar.liveSource"
    : "stockReceipts.toolbar.demoSource";
