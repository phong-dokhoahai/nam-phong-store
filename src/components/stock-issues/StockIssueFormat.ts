import type { TFunction } from "i18next";
import { getLineAmountIssue } from "@/utils/documentLines";
import { formatQuantity } from "@/utils/formatQuantity";
import type { StockIssueLine, StockIssueMaterialLookup } from "./types";

export const calculateLineTotal = (
  quantity: number,
  unitPrice: number,
  discountAmount: number,
) => Math.max(0, Math.round(quantity * unitPrice - discountAmount));

export const calculateSubtotal = (lines: { lineTotal: number }[]) =>
  lines.reduce((total, line) => total + line.lineTotal, 0);

export const calculateIssueTotal = (
  subtotal: number,
  discountAmount: number,
  shippingFee: number,
  taxAmount: number,
) => Math.max(0, subtotal - discountAmount + shippingFee + taxAmount);

/**
 * A saved draft can point to a partner or materials that were deactivated
 * later: they are missing from the active lookups and the save/confirm RPCs
 * reject them, so the editor must show them and ask for a replacement.
 */
export const findInactiveReferences = (
  partnerId: string,
  lines: { materialId: string }[],
  activePartners: { id: string }[],
  activeMaterials: { id: string }[],
) => ({
  partner:
    Boolean(partnerId) &&
    !activePartners.some((partner) => partner.id === partnerId),
  materialIds: lines
    .map((line) => line.materialId)
    .filter(
      (materialId) =>
        Boolean(materialId) &&
        !activeMaterials.some((material) => material.id === materialId),
    ),
});

/**
 * Error shown under a line, or "" when the line can be saved. `materials` are
 * the active lookups: a material missing from them was deactivated.
 */
export const getIssueLineError = (
  t: TFunction,
  line: StockIssueLine,
  lines: StockIssueLine[],
  materials: StockIssueMaterialLookup[],
) => {
  if (!line.materialId) return t("stockIssues.errors.lineMaterial");
  const material = materials.find((item) => item.id === line.materialId);
  if (!material) return t("stockIssues.errors.lineInactiveMaterial");

  switch (getLineAmountIssue(line, material.unitPrecision)) {
    case "quantity":
      return t("stockIssues.errors.lineQuantity");
    case "quantityDecimals":
      return material.unitPrecision === 0
        ? t("validation.quantityWhole", { unit: material.unitName })
        : t("validation.quantityDecimals", {
            unit: material.unitName,
            decimals: material.unitPrecision,
          });
    case "unitPrice":
      return t("stockIssues.errors.lineUnitPrice");
    case "discount":
      return t("stockIssues.errors.lineDiscount");
    case "discountTooHigh":
      return t("stockIssues.errors.lineDiscountTooHigh");
    case "fractionalTotal":
      return t("validation.fractionalLineTotal");
  }

  if (line.quantity > material.currentStock) {
    return t("stockIssues.errors.insufficientStock", {
      available: formatQuantity(material.currentStock),
    });
  }
  if (lines.filter((item) => item.materialId === line.materialId).length > 1) {
    return t("stockIssues.errors.duplicateMaterial");
  }
  return "";
};
