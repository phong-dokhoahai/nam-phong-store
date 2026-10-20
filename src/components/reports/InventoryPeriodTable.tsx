import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils";
import { formatQuantity } from "@/utils/formatQuantity";
import { useTranslation } from "react-i18next";
import { inventoryPeriodColumns } from "./inventoryPeriodColumns";
import type { InventoryPeriodRow } from "./types";

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
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell isHeader>
              {t("reports.inventoryPeriod.table.material")}
            </TableCell>
            {inventoryPeriodColumns.map((column) => (
              <TableCell key={column} isHeader align="end" className="px-3">
                {t(`reports.inventoryPeriod.table.${column}`)}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isMismatched = mismatchedIds.has(row.materialId);

            return (
              <TableRow key={row.materialId}>
                <TableCell>
                  <p className="font-medium text-fg">{row.name}</p>
                  <p className="mt-1 text-theme-xs">
                    {row.sku} · {row.unitName}
                  </p>
                </TableCell>
                {inventoryPeriodColumns.map((column) => (
                  <TableCell
                    key={column}
                    align="end"
                    className={cn(
                      "px-3",
                      column === "closing" &&
                        (isMismatched
                          ? "font-semibold text-error-600 dark:text-error-400"
                          : "font-semibold text-fg"),
                    )}
                  >
                    {formatQuantity(row[column])}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
