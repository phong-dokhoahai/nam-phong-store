export type StockIssueSource = "supabase" | "demo";

export type StockIssueStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export type StockIssuePaymentStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERPAID";

export type StockIssueCustomerLookup = {
  id: string;
  code: string;
  name: string;
};

export type StockIssueMaterialLookup = {
  id: string;
  sku: string;
  name: string;
  unitName: string;
  currentStock: number;
  defaultSalePrice: number;
};

export type StockIssueLine = {
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

export type StockIssue = {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  status: StockIssueStatus;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  paymentStatus: StockIssuePaymentStatus;
  deliveryAddress: string;
  note: string;
  updatedAt: string;
  lines: StockIssueLine[];
};

export type StockIssuePayload = {
  source: StockIssueSource;
  issues: StockIssue[];
  totalCount: number;
  customers: StockIssueCustomerLookup[];
  materials: StockIssueMaterialLookup[];
};

export type StockIssueDraftValues = {
  customerId: string;
  issueDate: string;
  deliveryAddress: string;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  note: string;
  lines: StockIssueLine[];
};
