import ComponentCard from "@/components/common/ComponentCard";
import StatCard from "@/components/common/StatCard";
import SegmentedControl from "@/components/common/SegmentedControl";
import ListPagination from "@/components/common/ListPagination";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { formatQuantity } from "@/components/materials/materialStatus";
import { formatCurrency } from "@/utils/formatCurrency";
import { useEffect, useMemo, useState } from "react";
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
import LoadingState from "@/components/common/LoadingState";
import InlineAlert from "@/components/common/InlineAlert";
import EmptyState from "@/components/common/EmptyState";

const PAGE_SIZE = 20;

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
  const [lookups, setLookups] = useState<DocumentReportLookups>({
    parties: [],
    materials: [],
    creators: [],
  });
  const [rows, setRows] = useState<DocumentReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const isRangeValid = isDateRangeValid(filters);

  useEffect(() => {
    let isMounted = true;

    const loadLookups = async () => {
      try {
        const data = await fetchDocumentReportLookups(kind);
        if (isMounted) setLookups(data);
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("reports.documents.errors.load"),
        );
      }
    };

    loadLookups();

    return () => {
      isMounted = false;
    };
  }, [kind, t]);

  useEffect(() => {
    if (!isRangeValid) return;
    let isMounted = true;

    const loadReport = async () => {
      setIsLoading(true);
      setError("");
      setPage(1);

      try {
        const data = await fetchDocumentReport(kind, filters);
        if (isMounted) setRows(data);
      } catch (loadError) {
        if (!isMounted) return;
        setRows([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("reports.documents.errors.load"),
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [filters, isRangeValid, kind, t]);

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

  const pagedDocuments = visibleDocuments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

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
      <PageBreadcrumb pageTitle={t(`reports.documents.${kind}.title`)} />

      <ComponentCard title={t(`reports.documents.${kind}.listTitle`)}>
        <div className="space-y-5">
          <DocumentReportFiltersBar
            kind={kind}
            filters={filters}
            lookups={lookups}
            onChange={setFilters}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SegmentedControl
              value={mode}
              onChange={setMode}
              options={(["documents", "materials"] as const).map((option) => ({
                value: option,
                label: t(`reports.documents.mode.${option}`),
              }))}
            />
            <ExportPdfButton
              buildData={buildPdfData}
              fileName={`${kind}-report-${filters.from}-${filters.to}`}
              disabled={isLoading || isEmpty}
            />
          </div>

          {!isRangeValid && (
            <p className="text-sm text-error-600 dark:text-error-400">
              {t("reports.revenue.errors.range")}
            </p>
          )}
          {error && <InlineAlert>{error}</InlineAlert>}

          {isLoading ? (
            <LoadingState label={t("reports.loading")} />
          ) : isEmpty ? (
            <EmptyState
              title={t("reports.documents.empty.title")}
              description={t("reports.documents.empty.description")}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                  <DocumentReportTable kind={kind} rows={pagedDocuments} />
                  <ListPagination
                    page={page}
                    pageSize={PAGE_SIZE}
                    totalItems={visibleDocuments.length}
                    onPageChange={setPage}
                  />
                </>
              ) : (
                <MaterialSummaryTable rows={materialRows} />
              )}

              {filters.materialId && mode === "documents" && (
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                  {t("reports.documents.materialFilterNote")}
                </p>
              )}
            </>
          )}
        </div>
      </ComponentCard>
    </div>
  );
}
