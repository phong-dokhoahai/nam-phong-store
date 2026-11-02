import ConfirmDialog from "@/components/common/ConfirmDialog";
import { formatCurrency } from "@/utils/formatCurrency";
import { useTranslation } from "react-i18next";
import type { StockIssue } from "./types";

type ConfirmStockIssueModalProps = {
  isOpen: boolean;
  issue: StockIssue | null;
  isSaving: boolean;
  /** Why the issue cannot be confirmed yet (e.g. deactivated customer). */
  blockedReason?: string;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmStockIssueModal({
  isOpen,
  issue,
  isSaving,
  blockedReason = "",
  error,
  onClose,
  onConfirm,
}: ConfirmStockIssueModalProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={t("stockIssues.confirm.title")}
      description={
        issue
          ? t("stockIssues.confirm.description", {
              code: issue.code,
              total: formatCurrency(issue.totalAmount),
            })
          : ""
      }
      confirmLabel={t("stockIssues.actions.confirm")}
      busyLabel={t("stockIssues.confirm.confirming")}
      isBusy={isSaving}
      confirmDisabled={!issue || Boolean(blockedReason)}
      error={blockedReason || error}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
