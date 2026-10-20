import Badge from "@/components/ui/badge/Badge";
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
import type {
  DocumentReportKind,
  DocumentReportRow,
  DocumentStatus,
} from "./types";

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
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell isHeader>
              {t("reports.documents.table.document")}
            </TableCell>
            <TableCell isHeader>
              {t(`reports.documents.${kind}.party`)}
            </TableCell>
            <TableCell isHeader>{t("reports.documents.table.items")}</TableCell>
            <TableCell isHeader>
              {t(`reports.documents.${kind}.creator`)}
            </TableCell>
            <TableCell isHeader>
              {t("reports.documents.table.status")}
            </TableCell>
            <TableCell isHeader align="end">
              {t("reports.documents.table.totalAmount")}
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="align-top">
                <p className="font-medium text-fg">{row.code}</p>
                <p className="mt-1 text-theme-xs">{row.date}</p>
              </TableCell>
              <TableCell className="align-top">{row.partyName}</TableCell>
              <TableCell className="min-w-64 align-top whitespace-normal">
                <ul className="space-y-1">
                  {row.items.map((item) => (
                    <li key={item.materialId}>
                      {item.materialName}:{" "}
                      <span className="font-medium text-fg">
                        {formatQuantity(item.quantity)} {item.unitName}
                      </span>
                    </li>
                  ))}
                </ul>
              </TableCell>
              <TableCell className="align-top">
                {row.creatorName ?? "—"}
              </TableCell>
              <TableCell className="align-top">
                <Badge color={statusColor[row.status]} size="sm">
                  {t(`reports.documents.status.${row.status}`)}
                </Badge>
              </TableCell>
              <TableCell align="end" className="align-top font-medium text-fg">
                {formatCurrency(row.totalAmount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
