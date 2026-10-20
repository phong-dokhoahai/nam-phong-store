import EmptyState from "@/components/common/EmptyState";
import Badge from "@/components/ui/badge/Badge";
import IconButton from "@/components/ui/button/IconButton";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarLineIcon } from "@/icons";
import { formatCurrency } from "@/utils/formatCurrency";
import { useTranslation } from "react-i18next";
import type { PaymentDocument } from "./types";

type PaymentsTableProps = {
  documents: PaymentDocument[];
  onPay: (document: PaymentDocument) => void;
};

const columns = [
  "document",
  "party",
  "direction",
  "total",
  "paid",
  "debt",
  "status",
  "actions",
] as const;
const endAligned = new Set<string>(["total", "paid", "debt", "actions"]);

export default function PaymentsTable({
  documents,
  onPay,
}: PaymentsTableProps) {
  const { t } = useTranslation();

  if (documents.length === 0) {
    return (
      <EmptyState
        title={t("payments.empty.title")}
        description={t("payments.empty.description")}
      />
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((key) => (
              <TableCell
                key={key}
                isHeader
                align={endAligned.has(key) ? "end" : "start"}
              >
                {t(`payments.table.${key}`)}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={`${document.direction}-${document.id}`}>
              <TableCell>
                <p className="font-medium text-fg">{document.code}</p>
                <p className="mt-1 text-theme-xs">{document.documentDate}</p>
              </TableCell>
              <TableCell>{document.partyName}</TableCell>
              <TableCell>
                <Badge
                  color={
                    document.direction === "customer" ? "success" : "warning"
                  }
                  size="sm"
                >
                  {t(`payments.direction.${document.direction}`)}
                </Badge>
              </TableCell>
              <TableCell align="end">
                {formatCurrency(document.totalAmount)}
              </TableCell>
              <TableCell align="end">
                {formatCurrency(document.paidAmount)}
              </TableCell>
              <TableCell align="end" className="font-medium text-fg">
                {formatCurrency(document.debtAmount)}
              </TableCell>
              <TableCell>
                <Badge
                  color={
                    document.paymentStatus === "PAID" ? "success" : "warning"
                  }
                  size="sm"
                >
                  {t(`payments.status.${document.paymentStatus}`)}
                </Badge>
              </TableCell>
              <TableCell align="end">
                <IconButton
                  icon={<DollarLineIcon className="size-4" />}
                  label={t("payments.actions.payDocument")}
                  onClick={() => onPay(document)}
                  disabled={document.debtAmount <= 0}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
