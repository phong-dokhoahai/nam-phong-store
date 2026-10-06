import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckLineIcon, EyeIcon, PencilIcon } from "@/icons";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatQuantity } from "./stockReceiptFormat";
import type { StockReceipt, StockReceiptStatus } from "./types";

type StockReceiptsTableProps = {
  receipts: StockReceipt[];
  selectedReceiptId: string;
  onSelect: (receipt: StockReceipt) => void;
  onConfirm: (receipt: StockReceipt) => void;
};

const statusColor: Record<
  StockReceiptStatus,
  "success" | "warning" | "error" | "light"
> = {
  DRAFT: "warning",
  CONFIRMED: "success",
  CANCELLED: "light",
};

export default function StockReceiptsTable({
  receipts,
  selectedReceiptId,
  onSelect,
  onConfirm,
}: StockReceiptsTableProps) {
  const { t } = useTranslation();

  if (receipts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
          {t("stockReceipts.empty.title")}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("stockReceipts.empty.description")}
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
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("stockReceipts.table.receipt")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("stockReceipts.table.supplier")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("stockReceipts.table.lines")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("stockReceipts.table.total")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("stockReceipts.table.status")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-end text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("stockReceipts.table.actions")}
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {receipts.map((receipt) => {
              const isDraft = receipt.status === "DRAFT";
              const SelectIcon = isDraft ? PencilIcon : EyeIcon;
              const selectLabel = isDraft
                ? t("stockReceipts.actions.edit")
                : t("stockReceipts.actions.view");

              return (
                <TableRow
                  key={receipt.id}
                  className={
                    receipt.id === selectedReceiptId
                      ? "bg-brand-50/60 dark:bg-brand-500/10"
                      : ""
                  }
                >
                  <TableCell className="px-5 py-4 text-start">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {receipt.code}
                      </p>
                      <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                        {receipt.receiptDate}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    {receipt.supplierName}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    {t("stockReceipts.table.lineSummary", {
                      count: receipt.lines.length,
                      quantity: formatQuantity(
                        receipt.lines.reduce(
                          (sum, line) => sum + line.quantity,
                          0,
                        ),
                      ),
                    })}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(receipt.totalAmount)}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-start">
                    <Badge color={statusColor[receipt.status]} size="sm">
                      {t(`stockReceipts.status.${receipt.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-end">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onSelect(receipt)}
                        aria-label={selectLabel}
                        title={selectLabel}
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-500 dark:border-gray-800 dark:text-gray-400 dark:hover:border-brand-700"
                      >
                        <SelectIcon className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onConfirm(receipt)}
                        aria-label={t("stockReceipts.actions.confirm")}
                        title={t("stockReceipts.actions.confirm")}
                        disabled={
                          receipt.status !== "DRAFT" ||
                          receipt.lines.length === 0
                        }
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-success-300 hover:text-success-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-800 dark:text-gray-400 dark:hover:border-success-700"
                      >
                        <CheckLineIcon className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
