import AsyncContent from "@/components/common/AsyncContent";
import DataSourceBadge from "@/components/common/DataSourceBadge";
import ListPagination from "@/components/common/ListPagination";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";
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
  StockReceiptPayload,
  StockReceiptStatus,
} from "@/components/stock-receipts/types";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useModal } from "@/hooks/useModal";
import { DEFAULT_PAGE_SIZE, useResettablePage } from "@/hooks/usePagination";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useCallback, useMemo, useState } from "react";
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
const PAGE_SIZE = DEFAULT_PAGE_SIZE;

const emptyPayload: StockReceiptPayload = {
  source: "demo",
  receipts: [],
  totalCount: 0,
  suppliers: [],
  materials: [],
};

export default function StockReceipts() {
  const { t } = useTranslation();
  const [selectedReceipt, setSelectedReceipt] = useState<StockReceipt | null>(
    null,
  );
  const [confirmingReceipt, setConfirmingReceipt] =
    useState<StockReceipt | null>(null);
  const [draft, setDraft] =
    useState<StockReceiptDraftValues>(getEmptyDraftValues);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | StockReceiptStatus>("all");
  const [page, setPage] = useResettablePage(`${search}|${status}`);
  const debouncedSearch = useDebouncedValue(search);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const confirmModal = useModal();
  const editorModal = useModal();

  const loadReceipts = useCallback(
    () =>
      fetchStockReceiptsPayload({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        status,
      }),
    [debouncedSearch, page, status],
  );
  const {
    data: payload,
    isLoading,
    error: loadError,
    reload,
    setData,
  } = useAsyncData(loadReceipts, {
    initialData: emptyPayload,
    errorMessage: t("stockReceipts.errors.load"),
    onSuccess: (loaded) => {
      const firstDraft =
        loaded.receipts.find((receipt) => receipt.status === "DRAFT") ||
        loaded.receipts[0] ||
        null;
      setError("");
      setSelectedReceipt(firstDraft);
      setDraft(
        firstDraft ? getDraftFromReceipt(firstDraft) : getEmptyDraftValues(),
      );
    },
  });
  const { receipts, suppliers, materials, source } = payload;

  // Demo data is filtered and paged here; Supabase does it server-side.
  const filteredReceipts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (source === "supabase") return receipts;
    return receipts.filter((receipt) => {
      const matchesSearch =
        !normalizedSearch ||
        receipt.code.toLowerCase().includes(normalizedSearch) ||
        receipt.supplierName.toLowerCase().includes(normalizedSearch) ||
        receipt.supplierInvoiceNumber.toLowerCase().includes(normalizedSearch);
      const matchesStatus = status === "all" || receipt.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [receipts, search, source, status]);
  const visibleReceipts =
    source === "supabase"
      ? filteredReceipts
      : filteredReceipts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    setData((current) => {
      const hasReceipt = current.receipts.some(
        (item) => item.id === receipt.id,
      );
      return {
        ...current,
        receipts: hasReceipt
          ? current.receipts.map((item) =>
              item.id === receipt.id ? receipt : item,
            )
          : [receipt, ...current.receipts],
      };
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

      upsertReceiptInList(savedReceipt);
      editorModal.closeModal();
    } catch (saveError) {
      setError(getErrorMessage(saveError, t("stockReceipts.errors.save")));
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
        getErrorMessage(confirmError, t("stockReceipts.errors.confirm")),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("stockReceipts.title")}
        description={t("stockReceipts.description")}
        meta={!isLoading && <DataSourceBadge source={source} />}
        actions={
          <Button
            startIcon={<PlusIcon className="size-5" />}
            onClick={openCreateDraft}
          >
            {t("stockReceipts.actions.create")}
          </Button>
        }
      />

      <section aria-label={t("stockReceipts.listTitle")} className="space-y-4">
        <StockReceiptsToolbar
          search={search}
          status={status}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
        />

        <AsyncContent
          isLoading={isLoading}
          error={loadError}
          onRetry={reload}
          loadingLabel={t("stockReceipts.loading")}
        >
          <StockReceiptsTable
            receipts={visibleReceipts}
            selectedReceiptId={selectedReceipt?.id || ""}
            onSelect={selectReceipt}
            onConfirm={openConfirmModal}
          />
          <ListPagination
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={
              source === "supabase"
                ? payload.totalCount
                : filteredReceipts.length
            }
            onPageChange={setPage}
          />
        </AsyncContent>
      </section>

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
