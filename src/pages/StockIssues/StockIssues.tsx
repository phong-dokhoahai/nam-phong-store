import AsyncContent from "@/components/common/AsyncContent";
import DataSourceBadge from "@/components/common/DataSourceBadge";
import ListPagination from "@/components/common/ListPagination";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";
import ConfirmStockIssueModal from "@/components/stock-issues/ConfirmStockIssueModal";
import StockIssueFormModal from "@/components/stock-issues/StockIssueFormModal";
import StockIssuesTable from "@/components/stock-issues/StockIssuesTable";
import StockIssuesToolbar from "@/components/stock-issues/StockIssuesToolbar";
import {
  confirmDemoStockIssue,
  confirmStockIssue,
  createDemoStockIssue,
  createStockIssue,
  fetchStockIssuesPayload,
  getEmptyDraftValues,
  updateStockIssue,
} from "@/components/stock-issues/StockIssuesRepository";
import type {
  StockIssue,
  StockIssueDraftValues,
  StockIssuePayload,
  StockIssueStatus,
} from "@/components/stock-issues/types";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useModal } from "@/hooks/useModal";
import { DEFAULT_PAGE_SIZE, useResettablePage } from "@/hooks/usePagination";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useCallback, useMemo, useState } from "react";
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
const PAGE_SIZE = DEFAULT_PAGE_SIZE;

const emptyPayload: StockIssuePayload = {
  source: "demo",
  issues: [],
  totalCount: 0,
  customers: [],
  materials: [],
};

export default function StockIssues() {
  const { t } = useTranslation();
  const [selectedIssue, setSelectedIssue] = useState<StockIssue | null>(null);
  const [confirmingIssue, setConfirmingIssue] = useState<StockIssue | null>(
    null,
  );
  const [draft, setDraft] =
    useState<StockIssueDraftValues>(getEmptyDraftValues);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | StockIssueStatus>("all");
  const [page, setPage] = useResettablePage(`${search}|${status}`);
  const debouncedSearch = useDebouncedValue(search);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const confirmModal = useModal();
  const editorModal = useModal();

  const loadIssues = useCallback(
    () =>
      fetchStockIssuesPayload({
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
  } = useAsyncData(loadIssues, {
    initialData: emptyPayload,
    errorMessage: t("stockIssues.errors.load"),
    onSuccess: (loaded) => {
      const firstDraft =
        loaded.issues.find((issue) => issue.status === "DRAFT") ||
        loaded.issues[0] ||
        null;
      setError("");
      setSelectedIssue(firstDraft);
      setDraft(
        firstDraft ? getDraftFromIssue(firstDraft) : getEmptyDraftValues(),
      );
    },
  });
  const { issues, customers, materials, source } = payload;

  // Demo data is filtered and paged here; Supabase does it server-side.
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

  const upsertIssueInList = (issue: StockIssue) => {
    setData((current) => {
      const hasIssue = current.issues.some((item) => item.id === issue.id);
      return {
        ...current,
        issues: hasIssue
          ? current.issues.map((item) => (item.id === issue.id ? issue : item))
          : [issue, ...current.issues],
      };
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

    if (hasDuplicateMaterial) {
      return t("stockIssues.errors.duplicateMaterial");
    }

    return "";
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

      upsertIssueInList(savedIssue);
      editorModal.closeModal();
    } catch (saveError) {
      setError(getErrorMessage(saveError, t("stockIssues.errors.save")));
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
      // Confirming changes available stock; refresh materials and the list.
      reload();
    } catch (confirmError) {
      setError(getErrorMessage(confirmError, t("stockIssues.errors.confirm")));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("stockIssues.title")}
        description={t("stockIssues.description")}
        meta={!isLoading && <DataSourceBadge source={source} />}
        actions={
          <Button
            startIcon={<PlusIcon className="size-5" />}
            onClick={openCreateDraft}
          >
            {t("stockIssues.actions.create")}
          </Button>
        }
      />

      <section aria-label={t("stockIssues.listTitle")} className="space-y-4">
        <StockIssuesToolbar
          search={search}
          status={status}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
        />

        <AsyncContent
          isLoading={isLoading}
          error={loadError}
          onRetry={reload}
          loadingLabel={t("stockIssues.loading")}
        >
          <StockIssuesTable
            issues={visibleIssues}
            selectedIssueId={selectedIssue?.id || ""}
            onSelect={selectIssue}
            onConfirm={openConfirmModal}
          />
          <ListPagination
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={
              source === "supabase" ? payload.totalCount : filteredIssues.length
            }
            onPageChange={setPage}
          />
        </AsyncContent>
      </section>

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
