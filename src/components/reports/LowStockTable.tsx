import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatQuantity } from "@/components/materials/materialStatus";
import { useTranslation } from "react-i18next";
import type { LowStockRow } from "./types";
import EmptyState from "@/components/common/EmptyState";

const headerClass =
  "px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400";

export default function LowStockTable({ rows }: { rows: LowStockRow[] }) {
  const { t } = useTranslation();

  if (rows.length === 0) {
    return (
      <EmptyState
        title={t("reports.lowStock.empty.title")}
        description={t("reports.lowStock.empty.description")}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/5">
            <TableRow>
              <TableCell isHeader className={headerClass}>
                {t("reports.lowStock.table.material")}
              </TableCell>
              <TableCell isHeader className={headerClass}>
                {t("reports.lowStock.table.category")}
              </TableCell>
              <TableCell isHeader className={headerClass}>
                {t("reports.lowStock.table.currentStock")}
              </TableCell>
              <TableCell isHeader className={headerClass}>
                {t("reports.lowStock.table.minimumStock")}
              </TableCell>
              <TableCell isHeader className={headerClass}>
                {t("reports.lowStock.table.shortage")}
              </TableCell>
              <TableCell isHeader className={headerClass}>
                {t("reports.lowStock.table.status")}
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-4 py-4 text-start">
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {row.name}
                  </p>
                  <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                    {row.sku}
                  </p>
                </TableCell>
                <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  {row.categoryName}
                </TableCell>
                <TableCell className="px-4 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                  {formatQuantity(row.currentStock)} {row.unitName}
                </TableCell>
                <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  {formatQuantity(row.minimumStock)} {row.unitName}
                </TableCell>
                <TableCell className="px-4 py-4 text-start text-theme-sm font-medium text-error-600 dark:text-error-400">
                  {formatQuantity(row.shortageQuantity)} {row.unitName}
                </TableCell>
                <TableCell className="px-4 py-4 text-start">
                  <Badge
                    color={row.isOutOfStock ? "error" : "warning"}
                    size="sm"
                  >
                    {t(
                      row.isOutOfStock
                        ? "reports.lowStock.status.outOfStock"
                        : "reports.lowStock.status.lowStock",
                    )}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
