import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ConfirmStockReceiptModal from "@/components/stock-receipts/ConfirmStockReceiptModal";
import StockReceiptFormModal from "@/components/stock-receipts/StockReceiptFormModal";
import StockReceiptsTable from "@/components/stock-receipts/StockReceiptsTable";
import StockReceiptsToolbar from "@/components/stock-receipts/StockReceiptsToolbar";
import {
  confirmDemoStockReceipt,
  confirmStockReceipt,
  createDemoStockReceipt,
  createStockReceipt,
  fetchStockReceiptsPayload,
  getEmptyDraftValues,
  updateStockReceipt,
} from "@/components/stock-receipts/stockReceiptsRepository";
import type {
  StockReceipt,
  StockReceiptDraftValues,
  StockReceiptMaterialLookup,
  StockReceiptSource,
  StockReceiptStatus,
  StockReceiptSupplierLookup,
} from "@/components/stock-receipts/types";
import { useModal } from "@/hooks/useModal";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const getDraftFromReceipt = (
  receipt: StockReceipt,
): StockReceiptDraftValues => ({
  supplierId: receipt.supplierId,
  receiptDate: receipt.receiptDate,
  supplierInvoiceNumber: receipt.supplierInvoiceNumber,
  discountAmount: receipt.discountAmount,
  shippingFee: receipt.shippingFee,
  taxAmount: receipt.taxAmount,
  note: receipt.note,
  lines: receipt.lines,
});

export default function StockReceipts() {
  const { t } = useTranslation();
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [suppliers, setSuppliers] = useState<StockReceiptSupplierLookup[]>([]);
  const [materials, setMaterials] = useState<StockReceiptMaterialLookup[]>([]);
  const [source, setSource] = useState<StockReceiptSource>("demo");
  const [selectedReceipt, setSelectedReceipt] = useState<StockReceipt | null>(
    null,
  );
  const [confirmingReceipt, setConfirmingReceipt] =
    useState<StockReceipt | null>(null);
  const [draft, setDraft] =
    useState<StockReceiptDraftValues>(getEmptyDraftValues);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | StockReceiptStatus>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  const confirmModal = useModal();
  const editorModal = useModal();

  const loadReceipts = useCallback(
    async (isMounted: () => boolean = () => true) => {
      setIsLoading(true);
      setLoadError("");
      setError("");

      try {
        const payload = await fetchStockReceiptsPayload();
        if (!isMounted()) return;
        setReceipts(payload.receipts);
        setSuppliers(payload.suppliers);
        setMaterials(payload.materials);
        setSource(payload.source);

        const firstDraft =
          payload.receipts.find((receipt) => receipt.status === "DRAFT") ||
          payload.receipts[0] ||
          null;
        setSelectedReceipt(firstDraft);
        setDraft(
          firstDraft ? getDraftFromReceipt(firstDraft) : getEmptyDraftValues(),
        );
      } catch (loadError) {
        if (!isMounted()) return;
        setLoadError(
          loadError instanceof Error
            ? loadError.message
            : t("stockReceipts.errors.load"),
        );
      } finally {
        if (isMounted()) setIsLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    let isMounted = true;

    void Promise.resolve().then(() => loadReceipts(() => isMounted));

    return () => {
      isMounted = false;
    };
  }, [loadReceipts]);

  const filteredReceipts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return receipts.filter((receipt) => {
      const matchesSearch =
        !normalizedSearch ||
        receipt.code.toLowerCase().includes(normalizedSearch) ||
        receipt.supplierName.toLowerCase().includes(normalizedSearch) ||
        receipt.supplierInvoiceNumber.toLowerCase().includes(normalizedSearch);
      const matchesStatus = status === "all" || receipt.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [receipts, search, status]);

  const openCreateDraft = () => {
    setSelectedReceipt(null);
    setDraft(getEmptyDraftValues());
    setError("");
    editorModal.openModal();
  };

  const selectReceipt = (receipt: StockReceipt) => {
    setSelectedReceipt(receipt);
    setDraft(getDraftFromReceipt(receipt));
    setError("");
    editorModal.openModal();
  };

  const upsertReceiptInList = (receipt: StockReceipt) => {
    setReceipts((current) => {
      const hasReceipt = current.some((item) => item.id === receipt.id);
      if (!hasReceipt) return [receipt, ...current];
      return current.map((item) => (item.id === receipt.id ? receipt : item));
    });
    setSelectedReceipt(receipt);
    setDraft(getDraftFromReceipt(receipt));
  };

  const validateDraft = () => {
    if (!draft.supplierId || !draft.receiptDate) {
      return t("stockReceipts.errors.requiredHeader");
    }

    if (draft.lines.length === 0) {
      return t("stockReceipts.errors.requiredLines");
    }

    const hasInvalidLine = draft.lines.some(
      (line) =>
        !line.materialId ||
        line.quantity <= 0 ||
        line.unitPrice < 0 ||
        line.discountAmount < 0 ||
        line.discountAmount > line.quantity * line.unitPrice,
    );

    if (hasInvalidLine) return t("stockReceipts.errors.invalidLine");

    const materialIds = draft.lines.map((line) => line.materialId);
    const hasDuplicateMaterial = materialIds.some(
      (materialId, index) => materialIds.indexOf(materialId) !== index,
    );

    if (hasDuplicateMaterial) {
      return t("stockReceipts.errors.duplicateMaterial");
    }

    return "";
  };

  const handleSave = async () => {
    const validationError = validateDraft();
    setError(validationError);
    if (validationError) return;

    setIsSaving(true);

    try {
      const savedReceipt =
        source === "supabase"
          ? selectedReceipt
            ? await updateStockReceipt(selectedReceipt.id, draft)
            : await createStockReceipt(draft)
          : createDemoStockReceipt(
              draft,
              suppliers,
              selectedReceipt || undefined,
            );

      if (
        source === "supabase" &&
        selectedReceipt &&
        savedReceipt.id !== selectedReceipt.id
      ) {
        setReceipts((current) =>
          current.filter((receipt) => receipt.id !== selectedReceipt.id),
        );
      }

      upsertReceiptInList(savedReceipt);
      editorModal.closeModal();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t("stockReceipts.errors.save"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openConfirmModal = (receipt: StockReceipt | null = selectedReceipt) => {
    if (!receipt || receipt.status !== "DRAFT") return;
    setConfirmingReceipt(receipt);
    setError("");
    confirmModal.openModal();
  };

  const handleConfirm = async () => {
    if (!confirmingReceipt) return;

    setIsSaving(true);
    setError("");

    try {
      const confirmedReceipt =
        source === "supabase"
          ? await confirmStockReceipt(confirmingReceipt.id)
          : confirmDemoStockReceipt(confirmingReceipt);

      upsertReceiptInList(confirmedReceipt);
      setConfirmingReceipt(null);
      confirmModal.closeModal();
      editorModal.closeModal();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : t("stockReceipts.errors.confirm"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle={t("stockReceipts.title")} />

      <ComponentCard title={t("stockReceipts.listTitle")}>
        <div className="space-y-5">
          <StockReceiptsToolbar
            search={search}
            status={status}
            source={source}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onCreate={openCreateDraft}
          />

          {isLoading ? (
            <StockReceiptsTableSkeleton label={t("stockReceipts.loading")} />
          ) : loadError ? (
            <div
              role="alert"
              className="rounded-xl border border-error-200 bg-error-50 px-6 py-8 text-center dark:border-error-500/20 dark:bg-error-500/10"
            >
              <p className="text-sm font-medium text-error-600 dark:text-error-400">
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => loadReceipts()}
                className="mt-4 rounded-lg border border-error-300 px-4 py-2 text-sm font-medium text-error-600 transition-colors hover:bg-error-100 dark:border-error-500/40 dark:text-error-400 dark:hover:bg-error-500/10"
              >
                {t("stockReceipts.errors.retry")}
              </button>
            </div>
          ) : (
            <StockReceiptsTable
              receipts={filteredReceipts}
              selectedReceiptId={selectedReceipt?.id || ""}
              onSelect={selectReceipt}
              onConfirm={openConfirmModal}
            />
          )}
        </div>
      </ComponentCard>

      <StockReceiptFormModal
        isOpen={editorModal.isOpen}
        draft={draft}
        selectedReceipt={selectedReceipt}
        suppliers={suppliers}
        materials={materials}
        isSaving={isSaving}
        error={!confirmModal.isOpen ? error : ""}
        onClose={editorModal.closeModal}
        onDraftChange={setDraft}
        onSave={handleSave}
        onConfirm={() => openConfirmModal()}
      />

      <ConfirmStockReceiptModal
        isOpen={confirmModal.isOpen}
        receipt={confirmingReceipt}
        isSaving={isSaving}
        error={confirmModal.isOpen ? error : ""}
        onClose={confirmModal.closeModal}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

function StockReceiptsTableSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/5 dark:bg-white/3"
    >
      <div className="mb-4 h-4 w-40 rounded bg-gray-100 dark:bg-gray-800" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.6fr] sm:items-center"
          >
            {Array.from({ length: 5 }).map((__, cellIndex) => (
              <div
                key={cellIndex}
                className="h-4 rounded bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
