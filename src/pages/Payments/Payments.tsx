import StatCard from "@/components/common/StatCard";
import TableSkeleton from "@/components/common/TableSkeleton";
import ComponentCard from "@/components/common/ComponentCard";
import InlineAlert from "@/components/common/InlineAlert";
import Button from "@/components/ui/button/Button";
import ListPagination from "@/components/common/ListPagination";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PaymentFormModal from "@/components/payments/PaymentFormModal";
import PaymentHistoryTable from "@/components/payments/PaymentHistoryTable";
import PaymentsTable from "@/components/payments/PaymentsTable";
import PaymentsToolbar from "@/components/payments/PaymentsToolbar";
import {
  fetchPaymentsPayload,
  getEmptyPaymentDraft,
  recordDemoPayment,
  recordPayment,
} from "@/components/payments/paymentsRepository";
import type {
  PaymentDirection,
  PaymentDocument,
  PaymentDraftValues,
  PaymentsPayload,
} from "@/components/payments/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { useModal } from "@/hooks/useModal";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const emptyPayload: PaymentsPayload = {
  source: "demo",
  documents: [],
  transactions: [],
};
const PAGE_SIZE = 20;

export default function Payments() {
  const { t } = useTranslation();
  const paymentModal = useModal();
  const [payload, setPayload] = useState<PaymentsPayload>(emptyPayload);
  const [draft, setDraft] = useState<PaymentDraftValues>(getEmptyPaymentDraft);
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<"all" | PaymentDirection>("all");
  const [documentPage, setDocumentPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  const loadPayments = useCallback(
    async (isMounted: () => boolean = () => true) => {
      setIsLoading(true);
      setLoadError("");
      setError("");

      try {
        const nextPayload = await fetchPaymentsPayload();
        if (isMounted()) setPayload(nextPayload);
      } catch (loadError) {
        if (!isMounted()) return;
        setLoadError(
          loadError instanceof Error
            ? loadError.message
            : t("payments.errors.load"),
        );
      } finally {
        if (isMounted()) setIsLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    let isMounted = true;
    void Promise.resolve().then(() => loadPayments(() => isMounted));
    return () => {
      isMounted = false;
    };
  }, [loadPayments]);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return payload.documents.filter((document) => {
      const matchesDirection =
        direction === "all" || document.direction === direction;
      const matchesSearch =
        !normalizedSearch ||
        document.code.toLowerCase().includes(normalizedSearch) ||
        document.partyName.toLowerCase().includes(normalizedSearch);

      return matchesDirection && matchesSearch;
    });
  }, [direction, payload.documents, search]);
  const visibleDocuments = filteredDocuments.slice(
    (documentPage - 1) * PAGE_SIZE,
    documentPage * PAGE_SIZE,
  );
  const visibleTransactions = payload.transactions.slice(
    (historyPage - 1) * PAGE_SIZE,
    historyPage * PAGE_SIZE,
  );

  useEffect(() => setDocumentPage(1), [direction, search]);

  const summary = useMemo(
    () =>
      payload.documents.reduce(
        (total, document) => {
          if (document.direction === "customer") {
            total.receivable += document.debtAmount;
          } else {
            total.payable += document.debtAmount;
          }
          return total;
        },
        { receivable: 0, payable: 0 },
      ),
    [payload.documents],
  );

  const openCreatePayment = (document?: PaymentDocument) => {
    setDraft(
      document
        ? {
            ...getEmptyPaymentDraft(document.direction),
            documentId: document.id,
            amount: document.debtAmount,
          }
        : getEmptyPaymentDraft(
            direction === "supplier" ? "supplier" : "customer",
          ),
    );
    setError("");
    paymentModal.openModal();
  };

  const validateDraft = () => {
    const document = payload.documents.find(
      (item) =>
        item.id === draft.documentId && item.direction === draft.direction,
    );

    if (!draft.documentId || !draft.paymentDate) {
      return t("payments.errors.required");
    }

    if (!document) return t("payments.errors.documentNotFound");

    if (draft.amount <= 0) return t("payments.errors.amountPositive");

    if (draft.amount > document.debtAmount) {
      return t("payments.errors.amountTooHigh", {
        amount: formatCurrency(document.debtAmount),
      });
    }

    return "";
  };

  const handleSave = async () => {
    const validationError = validateDraft();
    setError(validationError);
    if (validationError) return;

    setIsSaving(true);

    try {
      if (payload.source === "supabase") {
        await recordPayment(draft);
        await loadPayments();
      } else {
        setPayload((current) => recordDemoPayment(current, draft));
      }
      paymentModal.closeModal();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t("payments.errors.save"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle={t("payments.title")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label={t("payments.summary.receivable")}
          value={formatCurrency(summary.receivable)}
        />
        <StatCard
          label={t("payments.summary.payable")}
          value={formatCurrency(summary.payable)}
        />
      </div>

      <ComponentCard title={t("payments.listTitle")}>
        <div className="space-y-5">
          <PaymentsToolbar
            search={search}
            direction={direction}
            source={payload.source}
            onSearchChange={setSearch}
            onDirectionChange={setDirection}
            onCreate={() => openCreatePayment()}
          />

          {isLoading ? (
            <TableSkeleton label={t("payments.loading")} />
          ) : loadError ? (
            <InlineAlert
              layout="panel"
              action={
                <Button
                  variant="errorOutline"
                  size="sm"
                  onClick={() => loadPayments()}
                >
                  {t("payments.errors.retry")}
                </Button>
              }
            >
              {loadError}
            </InlineAlert>
          ) : (
            <PaymentsTable
              documents={visibleDocuments}
              onPay={openCreatePayment}
            />
          )}
          {!isLoading && !loadError && (
            <ListPagination
              page={documentPage}
              pageSize={PAGE_SIZE}
              totalItems={filteredDocuments.length}
              onPageChange={setDocumentPage}
            />
          )}
        </div>
      </ComponentCard>

      <ComponentCard title={t("payments.history.title")}>
        <PaymentHistoryTable transactions={visibleTransactions} />
        <ListPagination
          page={historyPage}
          pageSize={PAGE_SIZE}
          totalItems={payload.transactions.length}
          onPageChange={setHistoryPage}
        />
      </ComponentCard>

      <PaymentFormModal
        isOpen={paymentModal.isOpen}
        documents={payload.documents}
        draft={draft}
        isSaving={isSaving}
        error={error}
        onClose={paymentModal.closeModal}
        onDraftChange={setDraft}
        onSave={handleSave}
      />
    </div>
  );
}
