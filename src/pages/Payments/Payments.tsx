import ComponentCard from "@/components/common/ComponentCard";
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
import { formatCurrency } from "@/components/stock-receipts/stockReceiptFormat";
import { useModal } from "@/hooks/useModal";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const emptyPayload: PaymentsPayload = {
  source: "demo",
  documents: [],
  transactions: [],
};

export default function Payments() {
  const { t } = useTranslation();
  const paymentModal = useModal();
  const [payload, setPayload] = useState<PaymentsPayload>(emptyPayload);
  const [draft, setDraft] = useState<PaymentDraftValues>(getEmptyPaymentDraft);
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<"all" | PaymentDirection>("all");
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
        <DebtSummaryCard
          title={t("payments.summary.receivable")}
          value={summary.receivable}
        />
        <DebtSummaryCard
          title={t("payments.summary.payable")}
          value={summary.payable}
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
            <PaymentsSkeleton label={t("payments.loading")} />
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
                onClick={() => loadPayments()}
                className="mt-4 rounded-lg border border-error-300 px-4 py-2 text-sm font-medium text-error-600 transition-colors hover:bg-error-100 dark:border-error-500/40 dark:text-error-400 dark:hover:bg-error-500/10"
              >
                {t("payments.errors.retry")}
              </button>
            </div>
          ) : (
            <PaymentsTable
              documents={filteredDocuments}
              onPay={openCreatePayment}
            />
          )}
        </div>
      </ComponentCard>

      <ComponentCard title={t("payments.history.title")}>
        <PaymentHistoryTable transactions={payload.transactions} />
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

function DebtSummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/5 dark:bg-white/3">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-2 text-title-sm font-semibold text-gray-800 dark:text-white/90">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function PaymentsSkeleton({ label }: { label: string }) {
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
            className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.7fr] sm:items-center"
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
