export type PaymentSource = "supabase" | "demo";

export type PaymentDirection = "customer" | "supplier";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "OTHER";

export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERPAID";

export type PaymentDocument = {
  id: string;
  code: string;
  direction: PaymentDirection;
  partyId: string;
  partyName: string;
  documentDate: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  paymentStatus: PaymentStatus;
};

export type PaymentTransaction = {
  id: string;
  code: string;
  direction: PaymentDirection;
  documentId: string;
  documentCode: string;
  partyName: string;
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber: string;
  note: string;
};

export type PaymentDraftValues = {
  direction: PaymentDirection;
  documentId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  referenceNumber: string;
  note: string;
};

export type PaymentsPayload = {
  source: PaymentSource;
  documents: PaymentDocument[];
  transactions: PaymentTransaction[];
};
