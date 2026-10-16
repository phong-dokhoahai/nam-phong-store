import type { DocumentReportRow, MaterialSummaryRow } from "./types";

/** Quantity and value per material across the given documents. */
export const summarizeByMaterial = (
  rows: DocumentReportRow[],
): MaterialSummaryRow[] => {
  const summary = new Map<string, MaterialSummaryRow>();

  for (const row of rows) {
    for (const item of row.items) {
      const current = summary.get(item.materialId);

      if (current) {
        current.quantity += item.quantity;
        current.lineTotal += item.lineTotal;
        current.documentCount += 1;
      } else {
        summary.set(item.materialId, {
          materialId: item.materialId,
          materialName: item.materialName,
          materialSku: item.materialSku,
          unitName: item.unitName,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
          documentCount: 1,
        });
      }
    }
  }

  return [...summary.values()].sort((a, b) =>
    a.materialName.localeCompare(b.materialName),
  );
};

export const sumDocumentTotals = (rows: DocumentReportRow[]) =>
  rows.reduce((total, row) => total + row.totalAmount, 0);

export const sumLineTotals = (rows: MaterialSummaryRow[]) =>
  rows.reduce((total, row) => total + row.lineTotal, 0);
