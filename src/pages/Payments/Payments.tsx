import AsyncContent from "@/components/common/AsyncContent";
import DataSourceBadge from "@/components/common/DataSourceBadge";
import ListPagination from "@/components/common/ListPagination";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
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
import Button from "@/components/ui/button/Button";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useModal } from "@/hooks/useModal";
import { usePagedItems } from "@/hooks/usePagination";
import { PlusIcon } from "@/icons";
import { formatCurrency } from "@/utils/formatCurrency";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const emptyPayload: PaymentsPayload = {
  source: "demo",
  documents: [],
  transactions: [],
};

export default function Payments() {
  const { t } = useTranslation();
  const paymentModal = useModal();
  const [draft, setDraft] = useState<PaymentDraftValues>(getEmptyPaymentDraft);
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<"all" | PaymentDirection>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const {
    data: payload,
    isLoading,
    error: loadError,
    cachedAt,
    reload,
    setData,
  } = useAsyncData(fetchPaymentsPayload, {
    initialData: emptyPayload,
    errorMessage: t("payments.errors.load"),
    offlineKey: "payments",
  });

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
  const documentPaging = usePagedItems(
    filteredDocuments,
    `${direction}|${search}`,
  );
  const historyPaging = usePagedItems(payload.transactions, "");

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
        // Paid amounts and debt are computed in the database: refetch.
        reload();
      } else {
        setData((current) => recordDemoPayment(current, draft));
      }
      paymentModal.closeModal();
    } catch (saveError) {
      setError(getErrorMessage(saveError, t("payments.errors.save")));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("payments.title")}
        description={t("payments.description")}
        meta={!isLoading && <DataSourceBadge source={payload.source} cachedAt={cachedAt} />}
        actions={
          <Button
            startIcon={<PlusIcon className="size-5" />}
            onClick={() => openCreatePayment()}
          >
            {t("payments.actions.record")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label={t("payments.summary.receivable")}
          value={formatCurrency(summary.receivable)}
        />
        <StatCard
          label={t("payments.summary.payable")}
          value={formatCurrency(summary.payable)}
        />
      </div>

      <section aria-label={t("payments.listTitle")} className="space-y-4">
        <PaymentsToolbar
          search={search}
          direction={direction}
          onSearchChange={setSearch}
          onDirectionChange={setDirection}
        />

        <AsyncContent
          isLoading={isLoading}
          error={loadError}
          onRetry={reload}
          loadingLabel={t("payments.loading")}
        >
          <PaymentsTable
            documents={documentPaging.pageItems}
            onPay={openCreatePayment}
          />
          <ListPagination {...documentPaging.pagination} />
        </AsyncContent>
      </section>

      <section aria-labelledby="payment-history-title" className="space-y-3">
        <h2
          id="payment-history-title"
          className="text-base font-semibold text-fg"
        >
          {t("payments.history.title")}
        </h2>
        <AsyncContent
          isLoading={isLoading}
          loadingLabel={t("payments.loading")}
        >
          <PaymentHistoryTable transactions={historyPaging.pageItems} />
          <ListPagination {...historyPaging.pagination} />
        </AsyncContent>
      </section>

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
