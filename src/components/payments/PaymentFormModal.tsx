import InlineAlert from "@/components/common/InlineAlert";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/utils/formatCurrency";
import { useTranslation } from "react-i18next";
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
        <div>
          <Label htmlFor="payment-direction">
            {t("payments.form.direction")}
          </Label>
          <Select
            id="payment-direction"
            value={draft.direction}
            onChange={(value) => changeDirection(value as PaymentDirection)}
            options={[
              { value: "customer", label: t("payments.direction.customer") },
              { value: "supplier", label: t("payments.direction.supplier") },
            ]}
          />
        </div>

        <div>
          <Label htmlFor="payment-document">
            {t("payments.form.document")}
          </Label>
          <Select
            id="payment-document"
            value={draft.documentId}
            onChange={(value) => updateDraft("documentId", value)}
            placeholder={t("payments.form.documentPlaceholder")}
            options={payableDocuments.map((document) => ({
              value: document.id,
              label: `${document.code} - ${document.partyName} - ${formatCurrency(document.debtAmount)}`,
            }))}
          />
        </div>

        <div>
          <Label htmlFor="payment-amount">{t("payments.form.amount")}</Label>
          <Input
            id="payment-amount"
            type="number"
            min="0"
            max={selectedDocument?.debtAmount || undefined}
            value={draft.amount || ""}
            onChange={(event) =>
              updateDraft("amount", Number(event.target.value))
            }
            hint={
              selectedDocument
                ? t("payments.form.remaining", {
                    amount: formatCurrency(selectedDocument.debtAmount),
                  })
                : undefined
            }
          />
        </div>

        <div>
          <Label htmlFor="payment-date">{t("payments.form.paymentDate")}</Label>
          <Input
            id="payment-date"
            type="date"
            value={draft.paymentDate}
            onChange={(event) => updateDraft("paymentDate", event.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="payment-method">{t("payments.form.method")}</Label>
          <Select
            id="payment-method"
            value={draft.method}
            onChange={(value) => updateDraft("method", value as PaymentMethod)}
            options={(["CASH", "BANK_TRANSFER", "OTHER"] as const).map(
              (method) => ({
                value: method,
                label: t(`payments.method.${method}`),
              }),
            )}
          />
        </div>

        <div>
          <Label htmlFor="payment-reference">
            {t("payments.form.referenceNumber")}
          </Label>
          <Input
            id="payment-reference"
            value={draft.referenceNumber}
            onChange={(event) =>
              updateDraft("referenceNumber", event.target.value)
            }
            placeholder={t("payments.form.referencePlaceholder")}
          />
        </div>
      </div>

      <div className="mt-4">
        <Label>{t("payments.form.note")}</Label>
        <TextArea
          value={draft.note}
          onChange={(value) => updateDraft("note", value)}
          placeholder={t("payments.form.notePlaceholder")}
          rows={3}
        />
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
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? t("payments.actions.saving") : t("payments.actions.save")}
        </Button>
      </div>
    </Modal>
  );
}
