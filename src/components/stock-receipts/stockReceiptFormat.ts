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
