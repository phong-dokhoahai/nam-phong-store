import { Modal } from "@/components/ui/modal";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/utils/formatCurrency";
import type { StockIssue } from "./types";

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

      {error && (
        <div className="mt-5 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {t("common.close")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSaving || !issue}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          {isSaving
            ? t("stockIssues.confirm.confirming")
            : t("stockIssues.actions.confirm")}
        </button>
      </div>
    </Modal>
  );
}
