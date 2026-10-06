export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

export const formatQuantity = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(value);

export const calculateLineTotal = (
  quantity: number,
  unitPrice: number,
  discountAmount: number,
) => Math.max(0, Math.round(quantity * unitPrice - discountAmount));

export const calculateSubtotal = (lines: { lineTotal: number }[]) =>
  lines.reduce((total, line) => total + line.lineTotal, 0);

export const calculateReceiptTotal = (
  subtotal: number,
  discountAmount: number,
  shippingFee: number,
  taxAmount: number,
) => Math.max(0, subtotal - discountAmount + shippingFee + taxAmount);
