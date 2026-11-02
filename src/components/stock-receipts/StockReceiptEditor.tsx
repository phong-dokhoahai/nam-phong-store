import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import IconButton from "@/components/ui/button/IconButton";
import { useModalTitleId } from "@/components/ui/modal/modalTitle";
import EmptyState from "@/components/common/EmptyState";
import FieldError from "@/components/common/FieldError";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import {
  calculateLineTotal,
  calculateReceiptTotal,
  calculateSubtotal,
  findInactiveReferences,
} from "./stockReceiptFormat";
import { formatCurrency } from "@/utils/formatCurrency";
import type {
  StockReceipt,
  StockReceiptDraftValues,
  StockReceiptLine,
  StockReceiptMaterialLookup,
  StockReceiptSupplierLookup,
} from "./types";
import { TrashBinIcon } from "@/icons";
import { useTranslation } from "react-i18next";
import InlineAlert from "@/components/common/InlineAlert";

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
  const titleId = useModalTitleId();
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
  const inactive = findInactiveReferences(
    draft.supplierId,
    draft.lines,
    suppliers,
    materials,
  );
  const inactiveSupplierName =
    selectedReceipt?.supplierId === draft.supplierId
      ? selectedReceipt.supplierName
      : "";
  const isInactiveMaterial = (materialId: string) =>
    inactive.materialIds.includes(materialId);

  const getLineError = (line: StockReceiptLine) => {
    if (!line.materialId) return t("stockReceipts.errors.lineMaterial");
    if (isInactiveMaterial(line.materialId)) {
      return t("stockReceipts.errors.lineInactiveMaterial");
    }
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
    <div>
      <div className="border-b border-line-subtle pe-12 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={titleId} className="text-lg font-semibold text-fg">
            {selectedReceipt
              ? t("stockReceipts.editor.editTitle", {
                  code: selectedReceipt.code,
                })
              : t("stockReceipts.editor.createTitle")}
          </h2>
          {selectedReceipt && (
            <Badge color="light" size="sm">
              {t(`stockReceipts.status.${selectedReceipt.status}`)}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-fg-muted">
          {t("stockReceipts.editor.subtitle")}
        </p>
      </div>

      {error && <InlineAlert className="mt-5">{error}</InlineAlert>}

      {isDraftEditable &&
        (inactive.partner || inactive.materialIds.length > 0) && (
          <InlineAlert variant="warning" className="mt-5">
            {inactive.partner && (
              <p>
                {t("stockReceipts.errors.inactiveSupplier", {
                  name: inactiveSupplierName,
                })}
              </p>
            )}
            {inactive.materialIds.length > 0 && (
              <p>
                {t("stockReceipts.errors.inactiveMaterials", {
                  count: inactive.materialIds.length,
                })}
              </p>
            )}
          </InlineAlert>
        )}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div>
          <Label htmlFor="stock-receipt-supplier">
            {t("stockReceipts.form.supplier")}
          </Label>
          <Select
            id="stock-receipt-supplier"
            value={draft.supplierId}
            disabled={!isDraftEditable || isSaving}
            error={isDraftEditable && inactive.partner}
            onChange={(value) => setDraftField("supplierId", value)}
            placeholder={t("stockReceipts.form.supplierPlaceholder")}
            options={[
              ...suppliers.map((supplier) => ({
                value: supplier.id,
                label: supplier.name,
              })),
              // Keep a deactivated supplier visible (not selectable) so the
              // draft does not look empty.
              ...(inactive.partner
                ? [
                    {
                      value: draft.supplierId,
                      label: t("stockReceipts.form.inactiveSupplierOption", {
                        name: inactiveSupplierName,
                      }),
                      disabled: true,
                    },
                  ]
                : []),
            ]}
          />
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
          <h3 className="text-sm font-semibold text-fg">
            {t("stockReceipts.lines.title")}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addLine}
            disabled={!isDraftEditable || isSaving || materials.length === 0}
          >
            {t("stockReceipts.lines.add")}
          </Button>
        </div>

        {draft.lines.length === 0 ? (
          <EmptyState compact description={t("stockReceipts.lines.empty")} />
        ) : (
          <div className="divide-y divide-line-subtle rounded-xl border border-line">
            <div
              aria-hidden="true"
              className="hidden gap-3 rounded-t-xl bg-surface-subtle px-3 py-2 text-xs font-medium text-fg-muted lg:grid lg:grid-cols-[minmax(200px,1fr)_72px_112px_136px_128px_136px_32px]"
            >
              <span>{t("stockReceipts.lines.material")}</span>
              <span>{t("stockReceipts.lines.unit")}</span>
              <span className="text-end">
                {t("stockReceipts.lines.quantity")}
              </span>
              <span className="text-end">
                {t("stockReceipts.lines.unitPrice")}
              </span>
              <span className="text-end">
                {t("stockReceipts.lines.discount")}
              </span>
              <span className="text-end">
                {t("stockReceipts.lines.lineTotal")}
              </span>
              <span />
            </div>
            {draft.lines.map((line) => (
              <div
                key={line.id}
                className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(200px,1fr)_72px_112px_136px_128px_136px_32px] lg:items-start"
              >
                <div>
                  <Label htmlFor={`${line.id}-material`} className="lg:sr-only">
                    {t("stockReceipts.lines.material")}
                  </Label>
                  <Select
                    id={`${line.id}-material`}
                    value={line.materialId}
                    disabled={!isDraftEditable || isSaving}
                    error={Boolean(getLineError(line))}
                    onChange={(value) => updateLineMaterial(line.id, value)}
                    options={[
                      ...materials.map((material) => ({
                        value: material.id,
                        label: `${material.sku} - ${material.name}`,
                        disabled:
                          line.materialId !== material.id &&
                          selectedMaterialIds.includes(material.id),
                      })),
                      ...(isInactiveMaterial(line.materialId)
                        ? [
                            {
                              value: line.materialId,
                              label: t(
                                "stockReceipts.lines.inactiveMaterialOption",
                                {
                                  label: `${line.materialSku} - ${line.materialName}`,
                                },
                              ),
                              disabled: true,
                            },
                          ]
                        : []),
                    ]}
                  />
                </div>
                <div>
                  <Label className="lg:sr-only">
                    {t("stockReceipts.lines.unit")}
                  </Label>
                  <div className="flex h-11 items-center text-sm text-fg-muted">
                    {line.unitName}
                  </div>
                </div>
                <div>
                  <Label htmlFor={`${line.id}-quantity`} className="lg:sr-only">
                    {t("stockReceipts.lines.quantity")}
                  </Label>
                  <Input
                    id={`${line.id}-quantity`}
                    className="text-end"
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
                  <Label
                    htmlFor={`${line.id}-unitPrice`}
                    className="lg:sr-only"
                  >
                    {t("stockReceipts.lines.unitPrice")}
                  </Label>
                  <Input
                    id={`${line.id}-unitPrice`}
                    className="text-end"
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
                  <Label htmlFor={`${line.id}-discount`} className="lg:sr-only">
                    {t("stockReceipts.lines.discount")}
                  </Label>
                  <Input
                    id={`${line.id}-discount`}
                    className="text-end"
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
                </div>
                <div className="flex h-11 items-center justify-between gap-2 text-sm sm:col-span-2 lg:col-span-1 lg:justify-end">
                  <span className="text-fg-muted lg:sr-only">
                    {t("stockReceipts.lines.lineTotal")}
                  </span>
                  <span className="font-medium text-fg tabular-nums">
                    {formatCurrency(line.lineTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-end lg:h-11">
                  <IconButton
                    icon={<TrashBinIcon className="size-4" />}
                    label={t("stockReceipts.lines.remove")}
                    tone="error"
                    size="sm"
                    onClick={() => removeLine(line.id)}
                    disabled={!isDraftEditable || isSaving}
                  />
                </div>
                {getLineError(line) && (
                  <FieldError className="sm:col-span-2 lg:col-span-7">
                    {getLineError(line)}
                  </FieldError>
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
          <TextArea
            id="stock-receipt-note"
            value={draft.note}
            disabled={!isDraftEditable || isSaving}
            placeholder={t("stockReceipts.form.notePlaceholder")}
            onChange={(value) => setDraftField("note", value)}
            className="min-h-28"
          />
        </div>
        <div className="rounded-xl bg-surface-subtle p-4">
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
            <div className="border-t border-line-subtle pt-3">
              <SummaryRow
                label={t("stockReceipts.summary.total")}
                value={formatCurrency(totalAmount)}
                strong
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-line-subtle pt-4 sm:flex-row sm:justify-end">
        <Button onClick={onSave} disabled={!isDraftEditable || isSaving}>
          {isSaving
            ? t("stockReceipts.actions.saving")
            : t("stockReceipts.actions.saveDraft")}
        </Button>
        <Button
          variant="successOutline"
          onClick={onConfirm}
          disabled={
            !selectedReceipt || selectedReceipt.status !== "DRAFT" || isSaving
          }
        >
          {t("stockReceipts.actions.confirm")}
        </Button>
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
      <span className="text-fg-muted">{label}</span>
      <span
        className={
          strong
            ? "text-base font-semibold text-fg tabular-nums"
            : "text-fg tabular-nums"
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
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="mb-0 font-normal text-fg-muted">
        {label}
      </Label>
      <div className="w-40 shrink-0">
        <Input
          id={id}
          type="number"
          min={0}
          step={1}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(toMoneyValue(event.target.value))}
          className="h-9 text-end"
        />
      </div>
    </div>
  );
}
