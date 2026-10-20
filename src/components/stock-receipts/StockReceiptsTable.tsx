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
import { CheckLineIcon, EyeIcon, PencilIcon } from "@/icons";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatQuantity } from "@/utils/formatQuantity";
import { useTranslation } from "react-i18next";
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
      <EmptyState
        title={t("stockReceipts.empty.title")}
        description={t("stockReceipts.empty.description")}
      />
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell isHeader>{t("stockReceipts.table.receipt")}</TableCell>
            <TableCell isHeader>{t("stockReceipts.table.supplier")}</TableCell>
            <TableCell isHeader>{t("stockReceipts.table.lines")}</TableCell>
            <TableCell isHeader align="end">
              {t("stockReceipts.table.total")}
            </TableCell>
            <TableCell isHeader>{t("stockReceipts.table.status")}</TableCell>
            <TableCell isHeader align="end">
              {t("stockReceipts.table.actions")}
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
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
                <TableCell>
                  <p className="font-medium text-fg">{receipt.code}</p>
                  <p className="mt-1 text-theme-xs">{receipt.receiptDate}</p>
                </TableCell>
                <TableCell>{receipt.supplierName}</TableCell>
                <TableCell>
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
                <TableCell align="end" className="font-medium text-fg">
                  {formatCurrency(receipt.totalAmount)}
                </TableCell>
                <TableCell>
                  <Badge color={statusColor[receipt.status]} size="sm">
                    {t(`stockReceipts.status.${receipt.status}`)}
                  </Badge>
                </TableCell>
                <TableCell align="end">
                  <div className="flex justify-end gap-2">
                    <IconButton
                      icon={<SelectIcon className="size-4" />}
                      label={selectLabel}
                      onClick={() => onSelect(receipt)}
                    />
                    <IconButton
                      icon={<CheckLineIcon className="size-4" />}
                      label={t("stockReceipts.actions.confirm")}
                      tone="success"
                      onClick={() => onConfirm(receipt)}
                      disabled={
                        receipt.status !== "DRAFT" || receipt.lines.length === 0
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
