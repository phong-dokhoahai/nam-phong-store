import ComponentCard from "@/components/common/ComponentCard";
import EmptyState from "@/components/common/EmptyState";
import InlineAlert from "@/components/common/InlineAlert";
import LoadingState from "@/components/common/LoadingState";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
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
import { groupRevenue, sumRevenue } from "@/components/reports/revenueGrouping";
import type { DailySalesRow, RevenueGroupBy } from "@/components/reports/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatCurrency";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// react-apexcharts is browser-only and heavy; load it on demand (AGENTS.md).
const RevenueChart = lazy(() => import("@/components/reports/RevenueChart"));

const headerClass =
  "px-4 py-3 text-end text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400";
const numberCellClass =
  "px-4 py-4 text-end text-theme-sm text-gray-500 dark:text-gray-400";

export default function RevenueReport() {
  const { t } = useTranslation();
  const [range, setRange] = useState(defaultDateRange);
  const [groupBy, setGroupBy] = useState<RevenueGroupBy>("day");
  const [dailyRows, setDailyRows] = useState<DailySalesRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const isRangeValid = isDateRangeValid(range);

  useEffect(() => {
    if (!isRangeValid) return;
    let isMounted = true;

    const loadRevenue = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchDailySales(range.from, range.to);
        if (isMounted) setDailyRows(data);
      } catch (loadError) {
        if (!isMounted) return;
        setDailyRows([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("reports.revenue.errors.load"),
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadRevenue();

    return () => {
      isMounted = false;
    };
  }, [isRangeValid, range.from, range.to, t]);

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
      <PageBreadcrumb pageTitle={t("reports.revenue.title")} />

      <ComponentCard title={t("reports.revenue.listTitle")}>
        <div className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
              <DateRangeFields value={range} onChange={setRange} />
              <div>
                <Label>{t("reports.revenue.groupByLabel")}</Label>
                <SegmentedControl
                  aria-label={t("reports.revenue.groupByLabel")}
                  value={groupBy}
                  onChange={setGroupBy}
                  options={(["day", "week", "month"] as const).map(
                    (option) => ({
                      value: option,
                      label: t(`reports.revenue.groupBy.${option}`),
                    }),
                  )}
                />
              </div>
            </div>
            <ExportPdfButton
              buildData={buildPdfData}
              fileName={`revenue-report-${range.from}-${range.to}`}
              disabled={isLoading || !isRangeValid || periods.length === 0}
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
          ) : periods.length === 0 ? (
            <EmptyState
              title={t("reports.revenue.empty.title")}
              description={t("reports.revenue.empty.description")}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/5">
                      <TableRow>
                        <TableCell
                          isHeader
                          className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
                        >
                          {t("reports.revenue.table.period")}
                        </TableCell>
                        {(
                          [
                            "orders",
                            "totalAmount",
                            "returns",
                            "netRevenue",
                          ] as const
                        ).map((column) => (
                          <TableCell
                            key={column}
                            isHeader
                            className={headerClass}
                          >
                            {t(`reports.revenue.table.${column}`)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                      {periods.map((row) => (
                        <TableRow key={row.key}>
                          <TableCell className="px-4 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                            {row.key}
                          </TableCell>
                          <TableCell className={numberCellClass}>
                            {row.orderCount}
                          </TableCell>
                          <TableCell className={numberCellClass}>
                            {formatCurrency(row.totalAmount)}
                          </TableCell>
                          <TableCell className={numberCellClass}>
                            {formatCurrency(row.returnAmount)}
                          </TableCell>
                          <TableCell className="px-4 py-4 text-end text-theme-sm font-medium text-gray-800 dark:text-white/90">
                            {formatCurrency(row.netRevenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                {t("reports.revenue.note")}
              </p>
            </>
          )}
        </div>
      </ComponentCard>
    </div>
  );
}
