import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarLineIcon } from "@/icons";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/utils/formatCurrency";
import type { PaymentDocument } from "./types";

type PaymentsTableProps = {
  documents: PaymentDocument[];
  onPay: (document: PaymentDocument) => void;
};

export default function PaymentsTable({
  documents,
  onPay,
}: PaymentsTableProps) {
  const { t } = useTranslation();

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
          {t("payments.empty.title")}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("payments.empty.description")}
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
              {[
                "document",
                "party",
                "direction",
                "total",
                "paid",
                "debt",
                "status",
                "actions",
              ].map((key) => (
                <TableCell
                  key={key}
                  isHeader
                  className={`px-4 py-3 text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400 ${
                    key === "actions" ? "text-end" : "text-start"
                  }`}
                >
                  {t(`payments.table.${key}`)}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {documents.map((document) => (
              <TableRow key={`${document.direction}-${document.id}`}>
                <TableCell className="px-4 py-4 text-start">
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {document.code}
                  </p>
                  <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                    {document.documentDate}
                  </p>
                </TableCell>
                <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  {document.partyName}
                </TableCell>
                <TableCell className="px-4 py-4 text-start">
                  <Badge
                    color={
                      document.direction === "customer" ? "success" : "warning"
                    }
                    size="sm"
                  >
                    {t(`payments.direction.${document.direction}`)}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  {formatCurrency(document.totalAmount)}
                </TableCell>
                <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  {formatCurrency(document.paidAmount)}
                </TableCell>
                <TableCell className="px-4 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                  {formatCurrency(document.debtAmount)}
                </TableCell>
                <TableCell className="px-4 py-4 text-start">
                  <Badge
                    color={
                      document.paymentStatus === "PAID" ? "success" : "warning"
                    }
                    size="sm"
                  >
                    {t(`payments.status.${document.paymentStatus}`)}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-4 text-end">
                  <button
                    type="button"
                    onClick={() => onPay(document)}
                    disabled={document.debtAmount <= 0}
                    aria-label={t("payments.actions.payDocument")}
                    title={t("payments.actions.payDocument")}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-800 dark:text-gray-400 dark:hover:border-brand-700"
                  >
                    <DollarLineIcon className="size-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
