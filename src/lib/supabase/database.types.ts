// Placeholder for Supabase CLI generated types.
// Replace this file by running:
// supabase gen types typescript --project-id <project-id> > src/lib/supabase/database.types.ts
//
// This placeholder keeps the approved output path available until the project is
// linked and types can be generated from the applied migrations.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: "ADMIN" | "WAREHOUSE_STAFF";
      document_status: "DRAFT" | "CONFIRMED" | "CANCELLED";
      payment_status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERPAID";
      payment_method: "CASH" | "BANK_TRANSFER" | "OTHER";
      inventory_movement_type:
        | "PURCHASE_IN"
        | "SALE_OUT"
        | "SALE_RETURN_IN"
        | "PURCHASE_RETURN_OUT"
        | "ADJUSTMENT_IN"
        | "ADJUSTMENT_OUT"
        | "REVERSAL_IN"
        | "REVERSAL_OUT";
      debt_direction: "RECEIVABLE" | "PAYABLE";
      debt_entry_type: "CHARGE" | "PAYMENT" | "RETURN" | "REVERSAL" | "ADJUSTMENT";
    };
    CompositeTypes: Record<string, never>;
  };
};
