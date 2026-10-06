import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import {
  calculateLineTotal,
  calculateReceiptTotal,
  calculateSubtotal,
  formatCurrency,
} from "./stockReceiptFormat";
import type {
  StockReceipt,
  StockReceiptDraftValues,
  StockReceiptLine,
  StockReceiptMaterialLookup,
  StockReceiptSupplierLookup,
} from "./types";
import { TrashBinIcon } from "@/icons";
import { useTranslation } from "react-i18next";

type StockReceiptEditorProps = {
  draft: StockReceiptDraftValues;
  selectedReceipt: StockReceipt | null;
  suppliers: StockReceiptSupplierLookup[];
  materials: StockReceiptMaterialLookup[];
  isSaving: boolean;
  error: string;
  onDraftChange: (draft: StockReceiptDraftValues) => void;
  onSave: () => void;
  onConfirm: () => void;
};

const createLineId = () =>
  `line-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const toMoneyValue = (value: string) =>
  Math.max(0, Math.round(Number(value) || 0));
const toQuantityValue = (value: string) => Math.max(0, Number(value) || 0);

export default function StockReceiptEditor({
  draft,
  selectedReceipt,
  suppliers,
  materials,
  isSaving,
  error,
  onDraftChange,
  onSave,
  onConfirm,
}: StockReceiptEditorProps) {
  const { t } = useTranslation();
  const isDraftEditable =
    !selectedReceipt || selectedReceipt.status === "DRAFT";
  const subtotal = calculateSubtotal(draft.lines);
  const totalAmount = calculateReceiptTotal(
    subtotal,
    draft.discountAmount,
    draft.shippingFee,
    draft.taxAmount,
  );
  const selectedMaterialIds = draft.lines.map((line) => line.materialId);

  const getLineError = (line: StockReceiptLine) => {
    if (!line.materialId) return t("stockReceipts.errors.lineMaterial");
    if (line.quantity <= 0) return t("stockReceipts.errors.lineQuantity");
    if (line.unitPrice < 0) return t("stockReceipts.errors.lineUnitPrice");
    if (line.discountAmount < 0) return t("stockReceipts.errors.lineDiscount");
    if (line.discountAmount > line.quantity * line.unitPrice) {
      return t("stockReceipts.errors.lineDiscountTooHigh");
    }
    if (
      draft.lines.filter((item) => item.materialId === line.materialId).length >
      1
    ) {
      return t("stockReceipts.errors.duplicateMaterial");
    }
    return "";
  };

  const setDraftField = <K extends keyof StockReceiptDraftValues>(
    key: K,
    value: StockReceiptDraftValues[K],
  ) => {
    onDraftChange({ ...draft, [key]: value });
  };

  const addLine = () => {
    const material = materials.find(
      (item) => !draft.lines.some((line) => line.materialId === item.id),
    );

    if (!material) return;

    const newLine: StockReceiptLine = {
      id: createLineId(),
      materialId: material.id,
      materialSku: material.sku,
      materialName: material.name,
      unitName: material.unitName,
      quantity: 1,
      unitPrice: material.defaultPurchasePrice,
      discountAmount: 0,
      lineTotal: calculateLineTotal(1, material.defaultPurchasePrice, 0),
    };

    setDraftField("lines", [...draft.lines, newLine]);
  };

  const updateLine = (
    lineId: string,
    updater: (line: StockReceiptLine) => StockReceiptLine,
  ) => {
    setDraftField(
      "lines",
      draft.lines.map((line) => updater(line.id === lineId ? line : line)),
    );
  };

  const updateLineMaterial = (lineId: string, materialId: string) => {
    const material = materials.find((item) => item.id === materialId);
    if (!material) return;

    updateLine(lineId, (line) => {
      if (line.id !== lineId) return line;
      const unitPrice = material.defaultPurchasePrice;
      return {
        ...line,
        materialId: material.id,
        materialSku: material.sku,
        materialName: material.name,
        unitName: material.unitName,
        unitPrice,
        lineTotal: calculateLineTotal(
          line.quantity,
          unitPrice,
          line.discountAmount,
        ),
      };
    });
  };

  const updateLineNumber = (
    lineId: string,
    key: "quantity" | "unitPrice" | "discountAmount",
    value: number,
  ) => {
    updateLine(lineId, (line) => {
      if (line.id !== lineId) return line;
      const nextLine = { ...line, [key]: value };
      return {
        ...nextLine,
        lineTotal: calculateLineTotal(
          nextLine.quantity,
          nextLine.unitPrice,
          nextLine.discountAmount,
        ),
      };
    });
  };

  const removeLine = (lineId: string) => {
    setDraftField(
      "lines",
      draft.lines.filter((line) => line.id !== lineId),
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-gray-800">
        <div>
          <h3 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
            {selectedReceipt
              ? t("stockReceipts.editor.editTitle", {
                  code: selectedReceipt.code,
                })
              : t("stockReceipts.editor.createTitle")}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("stockReceipts.editor.subtitle")}
          </p>
        </div>
        {selectedReceipt && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {t(`stockReceipts.status.${selectedReceipt.status}`)}
          </span>
        )}
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div>
          <Label htmlFor="stock-receipt-supplier">
            {t("stockReceipts.form.supplier")}
          </Label>
          <select
            id="stock-receipt-supplier"
            value={draft.supplierId}
            disabled={!isDraftEditable || isSaving}
            onChange={(event) =>
              setDraftField("supplierId", event.target.value)
            }
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          >
            <option value="">
              {t("stockReceipts.form.supplierPlaceholder")}
            </option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="stock-receipt-date">
            {t("stockReceipts.form.receiptDate")}
          </Label>
          <Input
            id="stock-receipt-date"
            type="date"
            value={draft.receiptDate}
            disabled={!isDraftEditable || isSaving}
            onChange={(event) =>
              setDraftField("receiptDate", event.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="stock-receipt-invoice">
            {t("stockReceipts.form.supplierInvoiceNumber")}
          </Label>
          <Input
            id="stock-receipt-invoice"
            value={draft.supplierInvoiceNumber}
            disabled={!isDraftEditable || isSaving}
            placeholder={t("stockReceipts.form.supplierInvoicePlaceholder")}
            onChange={(event) =>
              setDraftField("supplierInvoiceNumber", event.target.value)
            }
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("stockReceipts.lines.title")}
          </h4>
          <button
            type="button"
            onClick={addLine}
            disabled={!isDraftEditable || isSaving || materials.length === 0}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t("stockReceipts.lines.add")}
          </button>
        </div>

        {draft.lines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {t("stockReceipts.lines.empty")}
          </div>
        ) : (
          <div className="space-y-3">
            {draft.lines.map((line) => (
              <div
                key={line.id}
                className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-4 lg:grid-cols-[minmax(220px,1.4fr)_110px_150px_150px_150px_44px] dark:border-gray-800"
              >
                <div>
                  <Label>{t("stockReceipts.lines.material")}</Label>
                  <select
                    value={line.materialId}
                    disabled={!isDraftEditable || isSaving}
                    aria-invalid={Boolean(getLineError(line))}
                    onChange={(event) =>
                      updateLineMaterial(line.id, event.target.value)
                    }
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  >
                    {materials.map((material) => (
                      <option
                        key={material.id}
                        value={material.id}
                        disabled={
                          line.materialId !== material.id &&
                          selectedMaterialIds.includes(material.id)
                        }
                      >
                        {material.sku} - {material.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>{t("stockReceipts.lines.unit")}</Label>
                  <div className="flex h-11 items-center rounded-lg border border-gray-200 px-3 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    {line.unitName}
                  </div>
                </div>
                <div>
                  <Label>{t("stockReceipts.lines.quantity")}</Label>
                  <Input
                    type="number"
                    min={0.001}
                    step={0.001}
                    value={line.quantity}
                    disabled={!isDraftEditable || isSaving}
                    aria-invalid={Boolean(getLineError(line))}
                    onChange={(event) =>
                      updateLineNumber(
                        line.id,
                        "quantity",
                        toQuantityValue(event.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <Label>{t("stockReceipts.lines.unitPrice")}</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={line.unitPrice}
                    disabled={!isDraftEditable || isSaving}
                    aria-invalid={Boolean(getLineError(line))}
                    onChange={(event) =>
                      updateLineNumber(
                        line.id,
                        "unitPrice",
                        toMoneyValue(event.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <Label>{t("stockReceipts.lines.discount")}</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={line.discountAmount}
                    disabled={!isDraftEditable || isSaving}
                    aria-invalid={Boolean(getLineError(line))}
                    onChange={(event) =>
                      updateLineNumber(
                        line.id,
                        "discountAmount",
                        toMoneyValue(event.target.value),
                      )
                    }
                  />
                  <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                    {formatCurrency(line.lineTotal)}
                  </p>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    disabled={!isDraftEditable || isSaving}
                    aria-label={t("stockReceipts.lines.remove")}
                    className="inline-flex size-11 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-error-300 hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-800 dark:text-gray-400 dark:hover:border-error-700"
                  >
                    <TrashBinIcon className="size-4" />
                  </button>
                </div>
                {getLineError(line) && (
                  <p
                    role="alert"
                    className="text-sm text-error-600 lg:col-span-6 dark:text-error-400"
                  >
                    {getLineError(line)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <div>
          <Label htmlFor="stock-receipt-note">
            {t("stockReceipts.form.note")}
          </Label>
          <textarea
            id="stock-receipt-note"
            value={draft.note}
            disabled={!isDraftEditable || isSaving}
            placeholder={t("stockReceipts.form.notePlaceholder")}
            onChange={(event) => setDraftField("note", event.target.value)}
            className="min-h-28 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="space-y-3">
            <SummaryRow
              label={t("stockReceipts.summary.subtotal")}
              value={formatCurrency(subtotal)}
            />
            <NumberSummaryInput
              id="stock-receipt-discount"
              label={t("stockReceipts.summary.receiptDiscount")}
              value={draft.discountAmount}
              disabled={!isDraftEditable || isSaving}
              onChange={(value) => setDraftField("discountAmount", value)}
            />
            <NumberSummaryInput
              id="stock-receipt-shipping"
              label={t("stockReceipts.summary.shippingFee")}
              value={draft.shippingFee}
              disabled={!isDraftEditable || isSaving}
              onChange={(value) => setDraftField("shippingFee", value)}
            />
            <NumberSummaryInput
              id="stock-receipt-tax"
              label={t("stockReceipts.summary.taxAmount")}
              value={draft.taxAmount}
              disabled={!isDraftEditable || isSaving}
              onChange={(value) => setDraftField("taxAmount", value)}
            />
            <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
              <SummaryRow
                label={t("stockReceipts.summary.total")}
                value={formatCurrency(totalAmount)}
                strong
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={!isDraftEditable || isSaving}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? t("stockReceipts.actions.saving")
            : t("stockReceipts.actions.saveDraft")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={
            !selectedReceipt || selectedReceipt.status !== "DRAFT" || isSaving
          }
          className="rounded-lg border border-success-300 px-4 py-2.5 text-sm font-medium text-success-600 transition-colors hover:bg-success-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-success-500/40 dark:text-success-400 dark:hover:bg-success-500/10"
        >
          {t("stockReceipts.actions.confirm")}
        </button>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={
          strong
            ? "font-semibold text-gray-800 dark:text-white/90"
            : "text-gray-700 dark:text-gray-300"
        }
      >
        {value}
      </span>
    </div>
  );
}

function NumberSummaryInput({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(toMoneyValue(event.target.value))}
      />
    </div>
  );
}
