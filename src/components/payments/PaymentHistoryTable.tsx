import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/utils/formatCurrency";
import type { PaymentTransaction } from "./types";

type PaymentHistoryTableProps = {
  transactions: PaymentTransaction[];
};

export default function PaymentHistoryTable({
  transactions,
}: PaymentHistoryTableProps) {
  const { t } = useTranslation();

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("payments.history.empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/5">
            <TableRow>
              {["payment", "document", "party", "date", "method", "amount"].map(
                (key) => (
                  <TableCell
                    key={key}
                    isHeader
                    className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
                  >
                    {t(`payments.history.${key}`)}
                  </TableCell>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {transactions.map((payment) => (
              <TableRow key={`${payment.direction}-${payment.id}`}>
                <TableCell className="px-4 py-4 text-start font-medium text-gray-800 dark:text-white/90">
                  {payment.code}
                </TableCell>
                <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  {payment.documentCode}
                </TableCell>
                <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  {payment.partyName}
                </TableCell>
                <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  {payment.paymentDate}
                </TableCell>
                <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  {t(`payments.method.${payment.method}`)}
                </TableCell>
                <TableCell className="px-4 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                  {formatCurrency(payment.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
