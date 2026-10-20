import ConfirmDialog from "@/components/common/ConfirmDialog";
import { formatCurrency } from "@/utils/formatCurrency";
import { useTranslation } from "react-i18next";
import type { StockReceipt } from "./types";

type ConfirmStockReceiptModalProps = {
  isOpen: boolean;
  receipt: StockReceipt | null;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmStockReceiptModal({
  isOpen,
  receipt,
  isSaving,
  error,
  onClose,
  onConfirm,
}: ConfirmStockReceiptModalProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={t("stockReceipts.confirm.title")}
      description={
        receipt
          ? t("stockReceipts.confirm.description", {
              code: receipt.code,
              total: formatCurrency(receipt.totalAmount),
            })
          : ""
      }
      confirmLabel={t("stockReceipts.actions.confirm")}
      busyLabel={t("stockReceipts.confirm.confirming")}
      isBusy={isSaving}
      confirmDisabled={!receipt}
      error={error}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
