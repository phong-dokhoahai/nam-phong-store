import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatQuantity } from "@/components/materials/materialStatus";
import { useTranslation } from "react-i18next";
import { inventoryPeriodColumns } from "./inventoryPeriodColumns";
import type { InventoryPeriodRow } from "./types";

const headerClass =
  "px-3 py-3 text-end text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400";

type InventoryPeriodTableProps = {
  rows: InventoryPeriodRow[];
  /** Material ids whose closing stock does not match current stock. */
  mismatchedIds: Set<string>;
};

export default function InventoryPeriodTable({
  rows,
  mismatchedIds,
}: InventoryPeriodTableProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/5">
            <TableRow>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("reports.inventoryPeriod.table.material")}
              </TableCell>
              {inventoryPeriodColumns.map((column) => (
                <TableCell key={column} isHeader className={headerClass}>
                  {t(`reports.inventoryPeriod.table.${column}`)}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {rows.map((row) => {
              const isMismatched = mismatchedIds.has(row.materialId);

              return (
                <TableRow key={row.materialId}>
                  <TableCell className="px-4 py-4 text-start">
                    <p className="font-medium text-gray-800 dark:text-white/90">
                      {row.name}
                    </p>
                    <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                      {row.sku} · {row.unitName}
                    </p>
                  </TableCell>
                  {inventoryPeriodColumns.map((column) => (
                    <TableCell
                      key={column}
                      className={`px-3 py-4 text-end text-theme-sm ${
                        column === "closing"
                          ? isMismatched
                            ? "font-semibold text-error-600 dark:text-error-400"
                            : "font-semibold text-gray-800 dark:text-white/90"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {formatQuantity(row[column])}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
