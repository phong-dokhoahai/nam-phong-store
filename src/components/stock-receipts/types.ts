export type StockReceiptSource = "supabase" | "demo";

export type StockReceiptStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export type StockReceiptPaymentStatus =
  "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERPAID";

export type StockReceiptSupplierLookup = {
  id: string;
  code: string;
  name: string;
};

export type StockReceiptMaterialLookup = {
  id: string;
  sku: string;
  name: string;
  unitName: string;
  currentStock: number;
  defaultPurchasePrice: number;
};

export type StockReceiptLine = {
  id: string;
  materialId: string;
  materialSku: string;
  materialName: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
};

export type StockReceipt = {
  id: string;
  code: string;
  supplierId: string;
  supplierName: string;
  receiptDate: string;
  status: StockReceiptStatus;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  paymentStatus: StockReceiptPaymentStatus;
  supplierInvoiceNumber: string;
  note: string;
  updatedAt: string;
  lines: StockReceiptLine[];
};

export type StockReceiptPayload = {
  source: StockReceiptSource;
  receipts: StockReceipt[];
  totalCount: number;
  suppliers: StockReceiptSupplierLookup[];
  materials: StockReceiptMaterialLookup[];
};

export type StockReceiptDraftValues = {
  supplierId: string;
  receiptDate: string;
  supplierInvoiceNumber: string;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  note: string;
  lines: StockReceiptLine[];
};
