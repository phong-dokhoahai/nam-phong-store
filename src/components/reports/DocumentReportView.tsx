import AsyncContent from "@/components/common/AsyncContent";
import EmptyState from "@/components/common/EmptyState";
import FieldError from "@/components/common/FieldError";
import InlineAlert from "@/components/common/InlineAlert";
import StatCard from "@/components/common/StatCard";
import SegmentedControl from "@/components/common/SegmentedControl";
import ListPagination from "@/components/common/ListPagination";
import PageHeader from "@/components/common/PageHeader";
import { formatQuantity } from "@/utils/formatQuantity";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePagedItems } from "@/hooks/usePagination";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import DocumentReportFiltersBar from "./DocumentReportFiltersBar";
import DocumentReportTable from "./DocumentReportTable";
import ExportPdfButton from "./ExportPdfButton";
import MaterialSummaryTable from "./MaterialSummaryTable";
import type { ReportPdfData } from "./pdf/ReportPdfDocument";
import {
  sumDocumentTotals,
  sumLineTotals,
  summarizeByMaterial,
} from "./documentReportAggregation";
import {
  fetchDocumentReport,
  fetchDocumentReportLookups,
} from "./documentReportRepository";
import { defaultDateRange, isDateRangeValid } from "./reportDates";
import type {
  DocumentReportFilters,
  DocumentReportKind,
  DocumentReportLookups,
  DocumentReportRow,
} from "./types";

const noRows: DocumentReportRow[] = [];
const emptyLookups: DocumentReportLookups = {
  parties: [],
  materials: [],
  creators: [],
};

type ReportMode = "documents" | "materials";

const initialFilters = (): DocumentReportFilters => ({
  ...defaultDateRange(),
  status: "CONFIRMED",
  partyId: "",
  materialId: "",
  creatorId: "",
});

export default function DocumentReportView({
  kind,
}: {
  kind: DocumentReportKind;
}) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState(initialFilters);
  const [mode, setMode] = useState<ReportMode>("documents");

  const isRangeValid = isDateRangeValid(filters);

  const loadLookups = useCallback(
    () => fetchDocumentReportLookups(kind),
    [kind],
  );
  const { data: lookups, error: lookupsError } = useAsyncData(loadLookups, {
    initialData: emptyLookups,
    errorMessage: t("reports.documents.errors.load"),
  });

  const loadReport = useMemo(
    () => (isRangeValid ? () => fetchDocumentReport(kind, filters) : null),
    [filters, isRangeValid, kind],
  );
  const {
    data: rows,
    isLoading,
    error,
    reload,
  } = useAsyncData(loadReport, {
    initialData: noRows,
    errorMessage: t("reports.documents.errors.load"),
  });

  // Never show data of a previous range while the current one is invalid.
  const visibleDocuments = useMemo(
    () => (isRangeValid ? rows : []),
    [isRangeValid, rows],
  );
  const materialRows = useMemo(
    () => summarizeByMaterial(visibleDocuments),
    [visibleDocuments],
  );
  // With a material filter, document totals include other materials, so the
  // headline value switches to that material's line totals.
  const totalValue = filters.materialId
    ? sumLineTotals(materialRows)
    : sumDocumentTotals(visibleDocuments);

  const paging = usePagedItems(visibleDocuments, JSON.stringify(filters));

  const lookupLabel = (list: { id: string; label: string }[], id: string) =>
    list.find((item) => item.id === id)?.label;

  const buildPdfData = (): ReportPdfData => {
    const meta = [
      t("reports.revenue.pdfPeriod", { from: filters.from, to: filters.to }),
      [
        t(`reports.documents.status.${filters.status}`),
        lookupLabel(lookups.parties, filters.partyId),
        lookupLabel(lookups.materials, filters.materialId),
        lookupLabel(lookups.creators, filters.creatorId),
      ]
        .filter(Boolean)
        .join(" · "),
    ];
    const common = {
      title: t(`reports.documents.${kind}.title`),
      companyName: t("reports.pdf.companyName"),
      meta,
      generatedAtLabel: t("reports.pdf.generatedAt", {
        time: new Date().toLocaleString(),
      }),
      pageLabel: t("reports.pdf.page"),
    };

    if (mode === "materials") {
      return {
        ...common,
        columns: [
          { header: t("reports.documents.table.material"), flex: 4 },
          {
            header: t("reports.documents.table.documentCount"),
            flex: 1,
            align: "right",
          },
          {
            header: t("reports.documents.table.quantity"),
            flex: 2,
            align: "right",
          },
          {
            header: t("reports.documents.table.lineTotal"),
            flex: 2,
            align: "right",
          },
        ],
        rows: materialRows.map((row) => [
          `${row.materialName} (${row.materialSku})`,
          String(row.documentCount),
          `${formatQuantity(row.quantity)} ${row.unitName}`,
          formatCurrency(row.lineTotal),
        ]),
        totals: [
          t("reports.pdf.total"),
          "",
          "",
          formatCurrency(sumLineTotals(materialRows)),
        ],
      };
    }

    return {
      ...common,
      landscape: true,
      columns: [
        { header: t("reports.documents.table.document"), flex: 2 },
        { header: t("reports.documents.table.date"), flex: 1.3 },
        { header: t(`reports.documents.${kind}.party`), flex: 2.5 },
        { header: t("reports.documents.table.items"), flex: 4 },
        { header: t(`reports.documents.${kind}.creator`), flex: 1.8 },
        { header: t("reports.documents.table.status"), flex: 1.5 },
        {
          header: t("reports.documents.table.totalAmount"),
          flex: 2,
          align: "right",
        },
      ],
      rows: visibleDocuments.map((row) => [
        row.code,
        row.date,
        row.partyName,
        row.items
          .map(
            (item) =>
              `${item.materialName}: ${formatQuantity(item.quantity)} ${item.unitName}`,
          )
          .join("\n"),
        row.creatorName ?? "—",
        t(`reports.documents.status.${row.status}`),
        formatCurrency(row.totalAmount),
      ]),
      totals: [
        t("reports.pdf.total"),
        "",
        "",
        "",
        "",
        "",
        formatCurrency(sumDocumentTotals(visibleDocuments)),
      ],
    };
  };

  const summaryCards = [
    {
      label: t("reports.documents.summary.documents"),
      value: String(visibleDocuments.length),
    },
    {
      label: t("reports.documents.summary.materials"),
      value: String(materialRows.length),
    },
    {
      label: t(
        filters.materialId
          ? "reports.documents.summary.materialValue"
          : "reports.documents.summary.totalValue",
      ),
      value: formatCurrency(totalValue),
    },
  ];

  const isEmpty = visibleDocuments.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(`reports.documents.${kind}.title`)}
        description={t(`reports.documents.${kind}.listTitle`)}
        actions={
          <ExportPdfButton
            buildData={buildPdfData}
            fileName={`${kind}-report-${filters.from}-${filters.to}`}
            disabled={isLoading || isEmpty}
          />
        }
      />

      <section className="space-y-5">
        <DocumentReportFiltersBar
          kind={kind}
          filters={filters}
          lookups={lookups}
          onChange={setFilters}
        />

        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={(["documents", "materials"] as const).map((option) => ({
            value: option,
            label: t(`reports.documents.mode.${option}`),
          }))}
        />

        {!isRangeValid && (
          <FieldError>{t("reports.revenue.errors.range")}</FieldError>
        )}
        {lookupsError && <InlineAlert>{lookupsError}</InlineAlert>}

        <AsyncContent
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          loadingLabel={t("reports.loading")}
          placeholder="box"
        >
          {isEmpty ? (
            <EmptyState
              title={t("reports.documents.empty.title")}
              description={t("reports.documents.empty.description")}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {summaryCards.map((card) => (
                  <StatCard
                    key={card.label}
                    label={card.label}
                    value={card.value}
                  />
                ))}
              </div>

              {mode === "documents" ? (
                <>
                  <DocumentReportTable kind={kind} rows={paging.pageItems} />
                  <ListPagination {...paging.pagination} />
                </>
              ) : (
                <MaterialSummaryTable rows={materialRows} />
              )}

              {filters.materialId && mode === "documents" && (
                <p className="text-theme-xs text-fg-muted">
                  {t("reports.documents.materialFilterNote")}
                </p>
              )}
            </>
          )}
        </AsyncContent>
      </section>
    </div>
  );
}
