import { Modal } from "@/components/ui/modal";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/utils/formatCurrency";
import type {
  PaymentDirection,
  PaymentDocument,
  PaymentDraftValues,
  PaymentMethod,
} from "./types";

type PaymentFormModalProps = {
  isOpen: boolean;
  documents: PaymentDocument[];
  draft: PaymentDraftValues;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onDraftChange: (values: PaymentDraftValues) => void;
  onSave: () => void;
};

export default function PaymentFormModal({
  isOpen,
  documents,
  draft,
  isSaving,
  error,
  onClose,
  onDraftChange,
  onSave,
}: PaymentFormModalProps) {
  const { t } = useTranslation();
  const payableDocuments = documents.filter(
    (document) =>
      document.direction === draft.direction && document.debtAmount > 0,
  );
  const selectedDocument = documents.find(
    (document) =>
      document.id === draft.documentId &&
      document.direction === draft.direction,
  );

  const updateDraft = <K extends keyof PaymentDraftValues>(
    key: K,
    value: PaymentDraftValues[K],
  ) => onDraftChange({ ...draft, [key]: value });

  const changeDirection = (direction: PaymentDirection) => {
    onDraftChange({
      ...draft,
      direction,
      documentId: "",
      amount: 0,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="pe-10">
        <h4 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
          {t("payments.form.title")}
        </h4>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t("payments.form.subtitle")}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            {t("payments.form.direction")}
          </span>
          <select
            value={draft.direction}
            onChange={(event) =>
              changeDirection(event.target.value as PaymentDirection)
            }
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pe-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          >
            <option value="customer">{t("payments.direction.customer")}</option>
            <option value="supplier">{t("payments.direction.supplier")}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            {t("payments.form.document")}
          </span>
          <select
            value={draft.documentId}
            onChange={(event) => updateDraft("documentId", event.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pe-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          >
            <option value="">{t("payments.form.documentPlaceholder")}</option>
            {payableDocuments.map((document) => (
              <option key={document.id} value={document.id}>
                {document.code} - {document.partyName} -{" "}
                {formatCurrency(document.debtAmount)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            {t("payments.form.amount")}
          </span>
          <input
            type="number"
            min="0"
            max={selectedDocument?.debtAmount || undefined}
            value={draft.amount || ""}
            onChange={(event) =>
              updateDraft("amount", Number(event.target.value))
            }
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
          {selectedDocument && (
            <span className="mt-1 block text-theme-xs text-gray-500 dark:text-gray-400">
              {t("payments.form.remaining", {
                amount: formatCurrency(selectedDocument.debtAmount),
              })}
            </span>
          )}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            {t("payments.form.paymentDate")}
          </span>
          <input
            type="date"
            value={draft.paymentDate}
            onChange={(event) => updateDraft("paymentDate", event.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            {t("payments.form.method")}
          </span>
          <select
            value={draft.method}
            onChange={(event) =>
              updateDraft("method", event.target.value as PaymentMethod)
            }
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pe-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          >
            <option value="CASH">{t("payments.method.CASH")}</option>
            <option value="BANK_TRANSFER">
              {t("payments.method.BANK_TRANSFER")}
            </option>
            <option value="OTHER">{t("payments.method.OTHER")}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            {t("payments.form.referenceNumber")}
          </span>
          <input
            value={draft.referenceNumber}
            onChange={(event) =>
              updateDraft("referenceNumber", event.target.value)
            }
            placeholder={t("payments.form.referencePlaceholder")}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          {t("payments.form.note")}
        </span>
        <textarea
          value={draft.note}
          onChange={(event) => updateDraft("note", event.target.value)}
          placeholder={t("payments.form.notePlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        />
      </label>

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
          onClick={onSave}
          disabled={isSaving}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          {isSaving ? t("payments.actions.saving") : t("payments.actions.save")}
        </button>
      </div>
    </Modal>
  );
}
