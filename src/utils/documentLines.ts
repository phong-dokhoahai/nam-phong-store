import { countDecimals, isWholeAmount } from "./numberInput";

/**
 * Amount rules shared by receipt and issue lines. They mirror
 * `parse_draft_items` (migration 202610160007) so the user sees a clear
 * message before the RPC rejects the draft:
 * quantity > 0, price >= 0, 0 <= discount <= quantity * price, and a whole
 * VND line total. `quantityDecimals` adds the unit's precision (UI only).
 */
export type LineAmountIssue =
  | "quantity"
  | "quantityDecimals"
  | "unitPrice"
  | "discount"
  | "discountTooHigh"
  | "fractionalTotal";

export const getLineAmountIssue = (
  line: { quantity: number; unitPrice: number; discountAmount: number },
  unitPrecision: number,
): LineAmountIssue | null => {
  if (line.quantity <= 0) return "quantity";
  if (countDecimals(line.quantity) > unitPrecision) return "quantityDecimals";
  if (line.unitPrice < 0) return "unitPrice";
  if (line.discountAmount < 0) return "discount";
  if (line.discountAmount > line.quantity * line.unitPrice) {
    return "discountTooHigh";
  }
  if (!isWholeAmount(line.quantity * line.unitPrice - line.discountAmount)) {
    return "fractionalTotal";
  }
  return null;
};

/** Document total must not go below 0 (`total_amount >= 0` in the database). */
export const isDocumentDiscountTooHigh = (
  subtotal: number,
  discountAmount: number,
  shippingFee: number,
  taxAmount: number,
) => discountAmount > subtotal + shippingFee + taxAmount;
