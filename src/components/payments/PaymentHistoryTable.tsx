import EmptyState from "@/components/common/EmptyState";
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
import type { PaymentTransaction } from "./types";

type PaymentHistoryTableProps = {
  transactions: PaymentTransaction[];
};

const columns = [
  "payment",
  "document",
  "party",
  "date",
  "method",
  "amount",
] as const;

export default function PaymentHistoryTable({
  transactions,
}: PaymentHistoryTableProps) {
  const { t } = useTranslation();

  if (transactions.length === 0) {
    return <EmptyState compact description={t("payments.history.empty")} />;
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
                align={key === "amount" ? "end" : "start"}
              >
                {t(`payments.history.${key}`)}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((payment) => (
            <TableRow key={`${payment.direction}-${payment.id}`}>
              <TableCell className="font-medium text-fg">
                {payment.code}
              </TableCell>
              <TableCell>{payment.documentCode}</TableCell>
              <TableCell>{payment.partyName}</TableCell>
              <TableCell>{payment.paymentDate}</TableCell>
              <TableCell>{t(`payments.method.${payment.method}`)}</TableCell>
              <TableCell align="end" className="font-medium text-fg">
                {formatCurrency(payment.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
