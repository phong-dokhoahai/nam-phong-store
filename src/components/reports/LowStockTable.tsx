import EmptyState from "@/components/common/EmptyState";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatQuantity } from "@/utils/formatQuantity";
import { useTranslation } from "react-i18next";
import type { LowStockRow } from "./types";

const columns = [
  "material",
  "category",
  "currentStock",
  "minimumStock",
  "shortage",
  "status",
] as const;

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
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column} isHeader>
                {t(`reports.lowStock.table.${column}`)}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <p className="font-medium text-fg">{row.name}</p>
                <p className="mt-1 text-theme-xs">{row.sku}</p>
              </TableCell>
              <TableCell>{row.categoryName}</TableCell>
              <TableCell className="font-medium text-fg">
                {formatQuantity(row.currentStock)} {row.unitName}
              </TableCell>
              <TableCell>
                {formatQuantity(row.minimumStock)} {row.unitName}
              </TableCell>
              <TableCell className="font-medium text-error-600 dark:text-error-400">
                {formatQuantity(row.shortageQuantity)} {row.unitName}
              </TableCell>
              <TableCell>
                <Badge color={row.isOutOfStock ? "error" : "warning"} size="sm">
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
    </TableContainer>
  );
}
