import Badge from "@/components/ui/badge/Badge";
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
import type {
  DocumentReportKind,
  DocumentReportRow,
  DocumentStatus,
} from "./types";

const headerClass =
  "px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400";

const statusColor: Record<DocumentStatus, "success" | "warning" | "error"> = {
  CONFIRMED: "success",
  DRAFT: "warning",
  CANCELLED: "error",
};

type DocumentReportTableProps = {
  kind: DocumentReportKind;
  rows: DocumentReportRow[];
};

export default function DocumentReportTable({
  kind,
  rows,
}: DocumentReportTableProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/5">
            <TableRow>
              <TableCell isHeader className={headerClass}>
                {t("reports.documents.table.document")}
              </TableCell>
              <TableCell isHeader className={headerClass}>
                {t(`reports.documents.${kind}.party`)}
              </TableCell>
              <TableCell isHeader className={headerClass}>
                {t("reports.documents.table.items")}
              </TableCell>
              <TableCell isHeader className={headerClass}>
                {t(`reports.documents.${kind}.creator`)}
              </TableCell>
              <TableCell isHeader className={headerClass}>
                {t("reports.documents.table.status")}
              </TableCell>
              <TableCell isHeader className={`${headerClass} text-end`}>
                {t("reports.documents.table.totalAmount")}
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-4 py-4 text-start align-top">
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {row.code}
                  </p>
                  <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                    {row.date}
                  </p>
                </TableCell>
                <TableCell className="px-4 py-4 text-start align-top text-theme-sm text-gray-500 dark:text-gray-400">
                  {row.partyName}
                </TableCell>
                <TableCell className="px-4 py-4 text-start align-top text-theme-sm text-gray-500 dark:text-gray-400">
                  <ul className="space-y-1">
                    {row.items.map((item) => (
                      <li key={item.materialId}>
                        {item.materialName}:{" "}
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {formatQuantity(item.quantity)} {item.unitName}
                        </span>
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="px-4 py-4 text-start align-top text-theme-sm text-gray-500 dark:text-gray-400">
                  {row.creatorName ?? "—"}
                </TableCell>
                <TableCell className="px-4 py-4 text-start align-top">
                  <Badge color={statusColor[row.status]} size="sm">
                    {t(`reports.documents.status.${row.status}`)}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-4 text-end align-top text-theme-sm font-medium text-gray-800 dark:text-white/90">
                  {formatCurrency(row.totalAmount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
