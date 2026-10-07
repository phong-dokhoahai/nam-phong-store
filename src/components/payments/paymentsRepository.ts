import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type {
  PaymentDirection,
  PaymentDocument,
  PaymentDraftValues,
  PaymentMethod,
  PaymentsPayload,
  PaymentTransaction,
} from "./types";

type PartyRelation =
  | { id: string; code: string; name: string }
  | { id: string; code: string; name: string }[]
  | null;

type DocumentRow = {
  id: string;
  code: string;
  customer_id?: string;
  supplier_id?: string;
  sale_date?: string;
  receipt_date?: string;
  total_amount: number | string | null;
  paid_amount: number | string | null;
  debt_amount: number | string | null;
  payment_status: PaymentDocument["paymentStatus"];
  customers?: PartyRelation;
  suppliers?: PartyRelation;
};

type PaymentRow = {
  id: string;
  code: string;
  customer_id?: string;
  supplier_id?: string;
  sales_order_id?: string;
  purchase_receipt_id?: string;
  payment_date: string;
  amount: number | string;
  method: PaymentMethod;
  reference_number: string | null;
  note: string | null;
  customers?: PartyRelation;
  suppliers?: PartyRelation;
  sales_orders?: { code: string } | { code: string }[] | null;
  purchase_receipts?: { code: string } | { code: string }[] | null;
};

const customerDocumentSelect = `
  id,
  code,
  customer_id,
  sale_date,
  total_amount,
  paid_amount,
  debt_amount,
  payment_status,
  customers ( id, code, name )
`;

const supplierDocumentSelect = `
  id,
  code,
  supplier_id,
  receipt_date,
  total_amount,
  paid_amount,
  debt_amount,
  payment_status,
  suppliers ( id, code, name )
`;

const customerPaymentSelect = `
  id,
  code,
  customer_id,
  sales_order_id,
  payment_date,
  amount,
  method,
  reference_number,
  note,
  customers ( id, code, name ),
  sales_orders!customer_payments_sales_order_id_fkey ( code )
`;

const supplierPaymentSelect = `
  id,
  code,
  supplier_id,
  purchase_receipt_id,
  payment_date,
  amount,
  method,
  reference_number,
  note,
  suppliers ( id, code, name ),
  purchase_receipts!supplier_payments_purchase_receipt_id_fkey ( code )
`;

const demoDocuments: PaymentDocument[] = [
  {
    id: "demo-sale-1",
    code: "BH-DEMO-1001",
    direction: "customer",
    partyId: "demo-customer-1",
    partyName: "Công ty Minh Anh",
    documentDate: "2026-10-06",
    totalAmount: 20000000,
    paidAmount: 5000000,
    debtAmount: 15000000,
    paymentStatus: "PARTIALLY_PAID",
  },
  {
    id: "demo-receipt-1",
    code: "PN-DEMO-2001",
    direction: "supplier",
    partyId: "demo-supplier-1",
    partyName: "Vật liệu Hòa Phát",
    documentDate: "2026-10-05",
    totalAmount: 32000000,
    paidAmount: 12000000,
    debtAmount: 20000000,
    paymentStatus: "PARTIALLY_PAID",
  },
];

const demoTransactions: PaymentTransaction[] = [
  {
    id: "demo-payment-1",
    code: "PT-DEMO-0001",
    direction: "customer",
    documentId: "demo-sale-1",
    documentCode: "BH-DEMO-1001",
    partyName: "Công ty Minh Anh",
    paymentDate: "2026-10-06",
    amount: 5000000,
    method: "BANK_TRANSFER",
    referenceNumber: "VCB-1001",
    note: "",
  },
  {
    id: "demo-payment-2",
    code: "PC-DEMO-0001",
    direction: "supplier",
    documentId: "demo-receipt-1",
    documentCode: "PN-DEMO-2001",
    partyName: "Vật liệu Hòa Phát",
    paymentDate: "2026-10-05",
    amount: 12000000,
    method: "CASH",
    referenceNumber: "",
    note: "",
  },
];

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
};

const readOne = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
};

const toDocument = (
  row: DocumentRow,
  direction: PaymentDirection,
): PaymentDocument => {
  const party = readOne(
    direction === "customer" ? row.customers : row.suppliers,
  );

  return {
    id: row.id,
    code: row.code,
    direction,
    partyId:
      direction === "customer" ? row.customer_id || "" : row.supplier_id || "",
    partyName: party?.name || "",
    documentDate:
      direction === "customer" ? row.sale_date || "" : row.receipt_date || "",
    totalAmount: toNumber(row.total_amount),
    paidAmount: toNumber(row.paid_amount),
    debtAmount: toNumber(row.debt_amount),
    paymentStatus: row.payment_status,
  };
};

const toPayment = (
  row: PaymentRow,
  direction: PaymentDirection,
): PaymentTransaction => {
  const party = readOne(
    direction === "customer" ? row.customers : row.suppliers,
  );
  const document = readOne(
    direction === "customer" ? row.sales_orders : row.purchase_receipts,
  );

  return {
    id: row.id,
    code: row.code,
    direction,
    documentId:
      direction === "customer"
        ? row.sales_order_id || ""
        : row.purchase_receipt_id || "",
    documentCode: document?.code || "",
    partyName: party?.name || "",
    paymentDate: row.payment_date,
    amount: toNumber(row.amount),
    method: row.method,
    referenceNumber: row.reference_number || "",
    note: row.note || "",
  };
};

export const isPaymentsBackendAvailable = () =>
  isSupabaseConfigured && Boolean(supabase);

export const fetchPaymentsPayload = async (): Promise<PaymentsPayload> => {
  if (!isPaymentsBackendAvailable() || !supabase) {
    return {
      source: "demo",
      documents: demoDocuments,
      transactions: demoTransactions,
    };
  }

  const [
    salesOrdersResult,
    purchaseReceiptsResult,
    customerPaymentsResult,
    supplierPaymentsResult,
  ] = await Promise.all([
    supabase
      .from("sales_orders")
      .select(customerDocumentSelect)
      .eq("status", "CONFIRMED")
      .order("sale_date", { ascending: false }),
    supabase
      .from("purchase_receipts")
      .select(supplierDocumentSelect)
      .eq("status", "CONFIRMED")
      .order("receipt_date", { ascending: false }),
    supabase
      .from("customer_payments")
      .select(customerPaymentSelect)
      .order("payment_date", { ascending: false }),
    supabase
      .from("supplier_payments")
      .select(supplierPaymentSelect)
      .order("payment_date", { ascending: false }),
  ]);

  if (
    salesOrdersResult.error ||
    purchaseReceiptsResult.error ||
    customerPaymentsResult.error ||
    supplierPaymentsResult.error
  ) {
    throw new Error(
      salesOrdersResult.error?.message ||
        purchaseReceiptsResult.error?.message ||
        customerPaymentsResult.error?.message ||
        supplierPaymentsResult.error?.message ||
        "Unable to load payments.",
    );
  }

  return {
    source: "supabase",
    documents: [
      ...((salesOrdersResult.data || []) as DocumentRow[]).map((row) =>
        toDocument(row, "customer"),
      ),
      ...((purchaseReceiptsResult.data || []) as DocumentRow[]).map((row) =>
        toDocument(row, "supplier"),
      ),
    ],
    transactions: [
      ...((customerPaymentsResult.data || []) as PaymentRow[]).map((row) =>
        toPayment(row, "customer"),
      ),
      ...((supplierPaymentsResult.data || []) as PaymentRow[]).map((row) =>
        toPayment(row, "supplier"),
      ),
    ].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)),
  };
};

export const recordPayment = async (
  values: PaymentDraftValues,
): Promise<void> => {
  if (!supabase) throw new Error("Supabase is not configured.");

  const rpcName =
    values.direction === "customer"
      ? "record_customer_payment"
      : "record_supplier_payment";
  const documentKey =
    values.direction === "customer" ? "sales_order_id" : "purchase_receipt_id";

  const { error } = await supabase.rpc(rpcName, {
    [documentKey]: values.documentId,
    amount: values.amount,
    payment_date: values.paymentDate,
    method: values.method,
    reference_number: values.referenceNumber.trim() || null,
    note: values.note.trim() || null,
  });

  if (error) throw new Error(error.message);
};

export const recordDemoPayment = (
  payload: PaymentsPayload,
  values: PaymentDraftValues,
): PaymentsPayload => {
  const document = payload.documents.find(
    (item) =>
      item.id === values.documentId && item.direction === values.direction,
  );

  if (!document) throw new Error("Document not found.");
  if (values.amount <= 0 || values.amount > document.debtAmount) {
    throw new Error("Invalid payment amount.");
  }

  const nextDocument: PaymentDocument = {
    ...document,
    paidAmount: document.paidAmount + values.amount,
    debtAmount: document.debtAmount - values.amount,
    paymentStatus:
      document.debtAmount - values.amount === 0 ? "PAID" : "PARTIALLY_PAID",
  };

  const transaction: PaymentTransaction = {
    id: `demo-payment-${Date.now()}`,
    code: `${values.direction === "customer" ? "PT" : "PC"}-DEMO-${Date.now()
      .toString()
      .slice(-4)}`,
    direction: values.direction,
    documentId: document.id,
    documentCode: document.code,
    partyName: document.partyName,
    paymentDate: values.paymentDate,
    amount: values.amount,
    method: values.method,
    referenceNumber: values.referenceNumber.trim(),
    note: values.note.trim(),
  };

  return {
    ...payload,
    documents: payload.documents.map((item) =>
      item.id === document.id && item.direction === document.direction
        ? nextDocument
        : item,
    ),
    transactions: [transaction, ...payload.transactions],
  };
};

export const getEmptyPaymentDraft = (
  direction: PaymentDirection = "customer",
): PaymentDraftValues => ({
  direction,
  documentId: "",
  amount: 0,
  paymentDate: new Date().toISOString().slice(0, 10),
  method: "CASH",
  referenceNumber: "",
  note: "",
});
