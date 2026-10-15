import ComponentCard from "@/components/common/ComponentCard";
import ListPagination from "@/components/common/ListPagination";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ConfirmStockIssueModal from "@/components/stock-issues/ConfirmStockIssueModal";
import StockIssueFormModal from "@/components/stock-issues/StockIssueFormModal";
import {
  confirmDemoStockIssue,
  confirmStockIssue,
  createDemoStockIssue,
  createStockIssue,
  fetchStockIssuesPayload,
  getEmptyDraftValues,
  updateStockIssue,
} from "@/components/stock-issues/StockIssuesRepository";
import StockIssuesTable from "@/components/stock-issues/StockIssuesTable";
import StockIssuesToolbar from "@/components/stock-issues/StockIssuesToolbar";
import type {
  StockIssue,
  StockIssueCustomerLookup,
  StockIssueDraftValues,
  StockIssueMaterialLookup,
  StockIssueSource,
  StockIssueStatus,
} from "@/components/stock-issues/types";
import { useModal } from "@/hooks/useModal";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const getDraftFromIssue = (issue: StockIssue): StockIssueDraftValues => ({
  customerId: issue.customerId,
  issueDate: issue.issueDate,
  deliveryAddress: issue.deliveryAddress,
  discountAmount: issue.discountAmount,
  shippingFee: issue.shippingFee,
  taxAmount: issue.taxAmount,
  note: issue.note,
  lines: issue.lines,
});
const PAGE_SIZE = 20;

export default function StockIssues() {
  const { t } = useTranslation();
  const [issues, setIssues] = useState<StockIssue[]>([]);
  const [customers, setCustomers] = useState<StockIssueCustomerLookup[]>([]);
  const [materials, setMaterials] = useState<StockIssueMaterialLookup[]>([]);
  const [source, setSource] = useState<StockIssueSource>("demo");
  const [selectedIssue, setSelectedIssue] = useState<StockIssue | null>(null);
  const [confirmingIssue, setConfirmingIssue] = useState<StockIssue | null>(
    null,
  );
  const [draft, setDraft] =
    useState<StockIssueDraftValues>(getEmptyDraftValues);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | StockIssueStatus>("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const debouncedSearch = useDebouncedValue(search);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  const confirmModal = useModal();
  const editorModal = useModal();

  const loadIssues = useCallback(
    async (isMounted: () => boolean = () => true) => {
      setIsLoading(true);
      setLoadError("");
      setError("");

      try {
        const payload = await fetchStockIssuesPayload({
          page,
          pageSize: PAGE_SIZE,
          search: debouncedSearch,
          status,
        });
        if (!isMounted()) return;
        setIssues(payload.issues);
        setTotalCount(payload.totalCount);
        setCustomers(payload.customers);
        setMaterials(payload.materials);
        setSource(payload.source);

        const firstDraft =
          payload.issues.find((issue) => issue.status === "DRAFT") ||
          payload.issues[0] ||
          null;
        setSelectedIssue(firstDraft);
        setDraft(
          firstDraft ? getDraftFromIssue(firstDraft) : getEmptyDraftValues(),
        );
      } catch (loadError) {
        if (!isMounted()) return;
        setLoadError(
          loadError instanceof Error
            ? loadError.message
            : t("stockIssues.errors.load"),
        );
      } finally {
        if (isMounted()) setIsLoading(false);
      }
    },
    [debouncedSearch, page, status, t],
  );

  useEffect(() => {
    let isMounted = true;

    void Promise.resolve().then(() => loadIssues(() => isMounted));

    return () => {
      isMounted = false;
    };
  }, [loadIssues]);

  const filteredIssues = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (source === "supabase") return issues;
    return issues.filter((issue) => {
      const matchesSearch =
        !normalizedSearch ||
        issue.code.toLowerCase().includes(normalizedSearch) ||
        issue.customerName.toLowerCase().includes(normalizedSearch) ||
        issue.deliveryAddress.toLowerCase().includes(normalizedSearch);
      const matchesStatus = status === "all" || issue.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [issues, search, source, status]);
  const visibleIssues =
    source === "supabase"
      ? filteredIssues
      : filteredIssues.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search, status]);

  const upsertIssueInList = (issue: StockIssue) => {
    setIssues((current) => {
      const hasIssue = current.some((item) => item.id === issue.id);
      if (!hasIssue) return [issue, ...current];
      return current.map((item) => (item.id === issue.id ? issue : item));
    });
    setSelectedIssue(issue);
    setDraft(getDraftFromIssue(issue));
  };

  const validateDraft = () => {
    if (!draft.customerId || !draft.issueDate) {
      return t("stockIssues.errors.requiredHeader");
    }

    if (draft.lines.length === 0) {
      return t("stockIssues.errors.requiredLines");
    }

    const hasInvalidLine = draft.lines.some((line) => {
      const material = materials.find((item) => item.id === line.materialId);
      return (
        !line.materialId ||
        line.quantity <= 0 ||
        line.unitPrice < 0 ||
        line.discountAmount < 0 ||
        line.discountAmount > line.quantity * line.unitPrice ||
        (material ? line.quantity > material.currentStock : false)
      );
    });

    if (hasInvalidLine) return t("stockIssues.errors.invalidLine");

    const materialIds = draft.lines.map((line) => line.materialId);
    const hasDuplicateMaterial = materialIds.some(
      (materialId, index) => materialIds.indexOf(materialId) !== index,
    );

    return hasDuplicateMaterial ? t("stockIssues.errors.duplicateMaterial") : "";
  };

  const openCreateDraft = () => {
    setSelectedIssue(null);
    setDraft(getEmptyDraftValues());
    setError("");
    editorModal.openModal();
  };

  const selectIssue = (issue: StockIssue) => {
    setSelectedIssue(issue);
    setDraft(getDraftFromIssue(issue));
    setError("");
    editorModal.openModal();
  };

  const handleSave = async () => {
    const validationError = validateDraft();
    setError(validationError);
    if (validationError) return;

    setIsSaving(true);

    try {
      const savedIssue =
        source === "supabase"
          ? selectedIssue
            ? await updateStockIssue(selectedIssue.id, draft)
            : await createStockIssue(draft)
          : createDemoStockIssue(draft, customers, selectedIssue || undefined);

      if (
        source === "supabase" &&
        selectedIssue &&
        savedIssue.id !== selectedIssue.id
      ) {
        setIssues((current) =>
          current.filter((issue) => issue.id !== selectedIssue.id),
        );
      }

      upsertIssueInList(savedIssue);
      editorModal.closeModal();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t("stockIssues.errors.save"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openConfirmModal = (issue: StockIssue | null = selectedIssue) => {
    if (!issue || issue.status !== "DRAFT") return;
    setConfirmingIssue(issue);
    setError("");
    confirmModal.openModal();
  };

  const handleConfirm = async () => {
    if (!confirmingIssue) return;

    setIsSaving(true);
    setError("");

    try {
      const confirmedIssue =
        source === "supabase"
          ? await confirmStockIssue(confirmingIssue.id)
          : confirmDemoStockIssue(confirmingIssue);

      upsertIssueInList(confirmedIssue);
      setConfirmingIssue(null);
      confirmModal.closeModal();
      editorModal.closeModal();
      void loadIssues();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : t("stockIssues.errors.confirm"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle={t("stockIssues.title")} />

      <ComponentCard title={t("stockIssues.listTitle")}>
        <div className="space-y-5">
          <StockIssuesToolbar
            search={search}
            status={status}
            source={source}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onCreate={openCreateDraft}
          />

          {isLoading ? (
            <StockIssuesTableSkeleton label={t("stockIssues.loading")} />
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
                onClick={() => loadIssues()}
                className="mt-4 rounded-lg border border-error-300 px-4 py-2 text-sm font-medium text-error-600 transition-colors hover:bg-error-100 dark:border-error-500/40 dark:text-error-400 dark:hover:bg-error-500/10"
              >
                {t("stockIssues.errors.retry")}
              </button>
            </div>
          ) : (
            <StockIssuesTable
              issues={visibleIssues}
              selectedIssueId={selectedIssue?.id || ""}
              onSelect={selectIssue}
              onConfirm={openConfirmModal}
            />
          )}
          {!isLoading && !loadError && (
            <ListPagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={source === "supabase" ? totalCount : filteredIssues.length}
              onPageChange={setPage}
            />
          )}
        </div>
      </ComponentCard>

      <StockIssueFormModal
        isOpen={editorModal.isOpen}
        draft={draft}
        selectedIssue={selectedIssue}
        customers={customers}
        materials={materials}
        isSaving={isSaving}
        error={!confirmModal.isOpen ? error : ""}
        onClose={editorModal.closeModal}
        onDraftChange={setDraft}
        onSave={handleSave}
        onConfirm={() => openConfirmModal()}
      />

      <ConfirmStockIssueModal
        isOpen={confirmModal.isOpen}
        issue={confirmingIssue}
        isSaving={isSaving}
        error={confirmModal.isOpen ? error : ""}
        onClose={confirmModal.closeModal}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

function StockIssuesTableSkeleton({ label }: { label: string }) {
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
