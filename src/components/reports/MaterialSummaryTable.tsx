import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatQuantity } from "@/components/materials/materialStatus";
import { formatCurrency } from "@/utils/formatCurrency";
import { useTranslation } from "react-i18next";
import type { MaterialSummaryRow } from "./types";

const headerClass =
  "px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400";
const numberClass =
  "px-4 py-4 text-end text-theme-sm text-gray-500 dark:text-gray-400";

export default function MaterialSummaryTable({
  rows,
}: {
  rows: MaterialSummaryRow[];
}) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/5">
            <TableRow>
              <TableCell isHeader className={headerClass}>
                {t("reports.documents.table.material")}
              </TableCell>
              <TableCell isHeader className={`${headerClass} text-end`}>
                {t("reports.documents.table.documentCount")}
              </TableCell>
              <TableCell isHeader className={`${headerClass} text-end`}>
                {t("reports.documents.table.quantity")}
              </TableCell>
              <TableCell isHeader className={`${headerClass} text-end`}>
                {t("reports.documents.table.lineTotal")}
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {rows.map((row) => (
              <TableRow key={row.materialId}>
                <TableCell className="px-4 py-4 text-start">
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {row.materialName}
                  </p>
                  <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                    {row.materialSku}
                  </p>
                </TableCell>
                <TableCell className={numberClass}>{row.documentCount}</TableCell>
                <TableCell className="px-4 py-4 text-end text-theme-sm font-medium text-gray-800 dark:text-white/90">
                  {formatQuantity(row.quantity)} {row.unitName}
                </TableCell>
                <TableCell className={numberClass}>
                  {formatCurrency(row.lineTotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
