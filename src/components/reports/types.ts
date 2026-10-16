export type LowStockRow = {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unitName: string;
  minimumStock: number;
  currentStock: number;
  shortageQuantity: number;
  isOutOfStock: boolean;
};

export type RevenueGroupBy = "day" | "week" | "month";

export type DailySalesRow = {
  date: string;
  orderCount: number;
  subtotal: number;
  discountAmount: number;
  shippingAndTax: number;
  totalAmount: number;
  returnCount: number;
  returnAmount: number;
  netRevenue: number;
};

export type RevenuePeriodRow = DailySalesRow & {
  /** Sortable period key: YYYY-MM-DD (day / week start) or YYYY-MM. */
  key: string;
};

/** purchase = báo cáo nhập kho (purchase_receipts), sales = xuất kho / bán hàng (sales_orders). */
export type DocumentReportKind = "purchase" | "sales";

export type DocumentStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export type DocumentReportItem = {
  materialId: string;
  materialName: string;
  materialSku: string;
  unitName: string;
  quantity: number;
  lineTotal: number;
};

export type DocumentReportRow = {
  id: string;
  code: string;
  date: string;
  status: DocumentStatus;
  partyName: string;
  /** Null when RLS hides the creator profile (staff can only read their own). */
  creatorName: string | null;
  totalAmount: number;
  items: DocumentReportItem[];
};

export type DocumentReportFilters = {
  from: string;
  to: string;
  status: DocumentStatus | "all";
  partyId: string;
  materialId: string;
  creatorId: string;
};

export type ReportLookup = { id: string; label: string };

export type DocumentReportLookups = {
  parties: ReportLookup[];
  materials: ReportLookup[];
  creators: ReportLookup[];
};

export type MaterialSummaryRow = {
  materialId: string;
  materialName: string;
  materialSku: string;
  unitName: string;
  quantity: number;
  lineTotal: number;
  documentCount: number;
};

export type InventoryPeriodRow = {
  materialId: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unitName: string;
  isActive: boolean;
  opening: number;
  importQuantity: number;
  customerReturnQuantity: number;
  adjustmentInQuantity: number;
  exportQuantity: number;
  supplierReturnQuantity: number;
  adjustmentOutQuantity: number;
  closing: number;
  currentStock: number;
};

/** customer = phải thu (RECEIVABLE), supplier = phải trả (PAYABLE). */
export type DebtReportKind = "customer" | "supplier";

export type DebtPeriodRow = {
  partyId: string;
  partyCode: string;
  partyName: string;
  openingDebt: number;
  debtIncrease: number;
  payment: number;
  returnAdjustment: number;
  otherAdjustment: number;
  closingDebt: number;
};
