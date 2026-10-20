import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatCurrency";
import { useTranslation } from "react-i18next";
import type { RevenuePeriodRow } from "./types";

const amountColumns = [
  "orders",
  "totalAmount",
  "returns",
  "netRevenue",
] as const;

type RevenueTableProps = {
  periods: RevenuePeriodRow[];
};

/** One row per day / week / month with order count and revenue amounts. */
export default function RevenueTable({ periods }: RevenueTableProps) {
  const { t } = useTranslation();

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell isHeader>{t("reports.revenue.table.period")}</TableCell>
            {amountColumns.map((column) => (
              <TableCell key={column} isHeader align="end">
                {t(`reports.revenue.table.${column}`)}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {periods.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-medium text-fg">{row.key}</TableCell>
              <TableCell align="end">{row.orderCount}</TableCell>
              <TableCell align="end">
                {formatCurrency(row.totalAmount)}
              </TableCell>
              <TableCell align="end">
                {formatCurrency(row.returnAmount)}
              </TableCell>
              <TableCell align="end" className="font-medium text-fg">
                {formatCurrency(row.netRevenue)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
