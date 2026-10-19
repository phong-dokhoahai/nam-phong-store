import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/utils/formatCurrency";
import type { StockIssue } from "./types";
import InlineAlert from "@/components/common/InlineAlert";

type ConfirmStockIssueModalProps = {
  isOpen: boolean;
  issue: StockIssue | null;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmStockIssueModal({
  isOpen,
  issue,
  isSaving,
  error,
  onClose,
  onConfirm,
}: ConfirmStockIssueModalProps) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6 lg:p-8">
      <div className="pe-10">
        <h4 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
          {t("stockIssues.confirm.title")}
        </h4>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {issue
            ? t("stockIssues.confirm.description", {
                code: issue.code,
                total: formatCurrency(issue.totalAmount),
              })
            : ""}
        </p>
      </div>

      {error && <InlineAlert className="mt-5">{error}</InlineAlert>}

      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isSaving}
        >
          {t("common.close")}
        </Button>
        <Button size="sm" onClick={onConfirm} disabled={isSaving || !issue}>
          {isSaving
            ? t("stockIssues.confirm.confirming")
            : t("stockIssues.actions.confirm")}
        </Button>
      </div>
    </Modal>
  );
}
