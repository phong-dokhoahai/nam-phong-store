// Same locale as formatCurrency: 17.000 viên, 1,5 m³.
const quantityFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 3,
});

/** Material quantities may be decimal (1.5 m³); show up to 3 decimals. */
export const formatQuantity = (value: number) =>
  quantityFormatter.format(value);
