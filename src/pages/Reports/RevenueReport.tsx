import AsyncContent from "@/components/common/AsyncContent";
import EmptyState from "@/components/common/EmptyState";
import FieldError from "@/components/common/FieldError";
import PageHeader from "@/components/common/PageHeader";
import SegmentedControl from "@/components/common/SegmentedControl";
import StatCard from "@/components/common/StatCard";
import Label from "@/components/form/Label";
import DateRangeFields from "@/components/reports/DateRangeFields";
import ExportPdfButton from "@/components/reports/ExportPdfButton";
import type { ReportPdfData } from "@/components/reports/pdf/ReportPdfDocument";
import {
  defaultDateRange,
  isDateRangeValid,
} from "@/components/reports/reportDates";
import { fetchDailySales } from "@/components/reports/reportsRepository";
import RevenueTable from "@/components/reports/RevenueTable";
import { groupRevenue, sumRevenue } from "@/components/reports/revenueGrouping";
import type { DailySalesRow, RevenueGroupBy } from "@/components/reports/types";
import { useAsyncData } from "@/hooks/useAsyncData";
import { formatCurrency } from "@/utils/formatCurrency";
import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// react-apexcharts is browser-only and heavy; load it on demand (AGENTS.md).
const RevenueChart = lazy(() => import("@/components/reports/RevenueChart"));

const noRows: DailySalesRow[] = [];

export default function RevenueReport() {
  const { t } = useTranslation();
  const [range, setRange] = useState(defaultDateRange);
  const [groupBy, setGroupBy] = useState<RevenueGroupBy>("day");

  const isRangeValid = isDateRangeValid(range);

  const loadRevenue = useMemo(
    () => (isRangeValid ? () => fetchDailySales(range.from, range.to) : null),
    [isRangeValid, range.from, range.to],
  );
  const {
    data: dailyRows,
    isLoading,
    error,
    reload,
  } = useAsyncData(loadRevenue, {
    initialData: noRows,
    errorMessage: t("reports.revenue.errors.load"),
  });

  // Ignore data of a previous range while the current range is invalid.
  const periods = useMemo(
    () => (isRangeValid ? groupRevenue(dailyRows, groupBy) : []),
    [dailyRows, groupBy, isRangeValid],
  );
  const totals = useMemo(() => sumRevenue(periods), [periods]);

  const buildPdfData = (): ReportPdfData => ({
    title: t("reports.revenue.title"),
    companyName: t("reports.pdf.companyName"),
    meta: [
      t("reports.revenue.pdfPeriod", { from: range.from, to: range.to }),
      t(`reports.revenue.groupBy.${groupBy}`),
    ],
    columns: [
      { header: t("reports.revenue.table.period"), flex: 2 },
      { header: t("reports.revenue.table.orders"), flex: 1, align: "right" },
      {
        header: t("reports.revenue.table.totalAmount"),
        flex: 2,
        align: "right",
      },
      { header: t("reports.revenue.table.returns"), flex: 2, align: "right" },
      {
        header: t("reports.revenue.table.netRevenue"),
        flex: 2,
        align: "right",
      },
    ],
    rows: periods.map((row) => [
      row.key,
      String(row.orderCount),
      formatCurrency(row.totalAmount),
      formatCurrency(row.returnAmount),
      formatCurrency(row.netRevenue),
    ]),
    totals: [
      t("reports.revenue.table.total"),
      String(totals.orderCount),
      formatCurrency(totals.totalAmount),
      formatCurrency(totals.returnAmount),
      formatCurrency(totals.netRevenue),
    ],
    generatedAtLabel: t("reports.pdf.generatedAt", {
      time: new Date().toLocaleString(),
    }),
    pageLabel: t("reports.pdf.page"),
  });

  const summaryCards = [
    {
      label: t("reports.revenue.summary.orders"),
      value: String(totals.orderCount),
    },
    {
      label: t("reports.revenue.summary.sales"),
      value: formatCurrency(totals.totalAmount),
    },
    {
      label: t("reports.revenue.summary.returns"),
      value: formatCurrency(totals.returnAmount),
    },
    {
      label: t("reports.revenue.summary.netRevenue"),
      value: formatCurrency(totals.netRevenue),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("reports.revenue.title")}
        description={t("reports.revenue.listTitle")}
        actions={
          <ExportPdfButton
            buildData={buildPdfData}
            fileName={`revenue-report-${range.from}-${range.to}`}
            disabled={isLoading || !isRangeValid || periods.length === 0}
          />
        }
      />

      <section className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(2,minmax(0,12rem))_auto] lg:items-end">
          <DateRangeFields value={range} onChange={setRange} />
          <div>
            <Label>{t("reports.revenue.groupByLabel")}</Label>
            <SegmentedControl
              aria-label={t("reports.revenue.groupByLabel")}
              value={groupBy}
              onChange={setGroupBy}
              options={(["day", "week", "month"] as const).map((option) => ({
                value: option,
                label: t(`reports.revenue.groupBy.${option}`),
              }))}
            />
          </div>
        </div>

        {!isRangeValid && (
          <FieldError>{t("reports.revenue.errors.range")}</FieldError>
        )}

        <AsyncContent
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          loadingLabel={t("reports.loading")}
          placeholder="box"
        >
          {periods.length === 0 ? (
            <EmptyState
              title={t("reports.revenue.empty.title")}
              description={t("reports.revenue.empty.description")}
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

              <Suspense fallback={<div className="h-70" />}>
                <RevenueChart rows={periods} />
              </Suspense>

              <RevenueTable periods={periods} />
              <p className="text-theme-xs text-fg-muted">
                {t("reports.revenue.note")}
              </p>
            </>
          )}
        </AsyncContent>
      </section>
    </div>
  );
}
