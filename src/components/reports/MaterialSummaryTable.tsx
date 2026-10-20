import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatQuantity } from "@/utils/formatQuantity";
import { useTranslation } from "react-i18next";
import type { MaterialSummaryRow } from "./types";

export default function MaterialSummaryTable({
  rows,
}: {
  rows: MaterialSummaryRow[];
}) {
  const { t } = useTranslation();

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell isHeader>
              {t("reports.documents.table.material")}
            </TableCell>
            <TableCell isHeader align="end">
              {t("reports.documents.table.documentCount")}
            </TableCell>
            <TableCell isHeader align="end">
              {t("reports.documents.table.quantity")}
            </TableCell>
            <TableCell isHeader align="end">
              {t("reports.documents.table.lineTotal")}
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.materialId}>
              <TableCell>
                <p className="font-medium text-fg">{row.materialName}</p>
                <p className="mt-1 text-theme-xs">{row.materialSku}</p>
              </TableCell>
              <TableCell align="end">{row.documentCount}</TableCell>
              <TableCell align="end" className="font-medium text-fg">
                {formatQuantity(row.quantity)} {row.unitName}
              </TableCell>
              <TableCell align="end">{formatCurrency(row.lineTotal)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
