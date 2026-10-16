import ComponentCard from "@/components/common/ComponentCard";
import ListPagination from "@/components/common/ListPagination";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatCurrency";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { debtColumns } from "./debtColumns";
import ExportPdfButton from "./ExportPdfButton";
import type { ReportPdfData } from "./pdf/ReportPdfDocument";
import { defaultDateRange, isDateRangeValid } from "./reportDates";
import { fetchDebtPeriod } from "./reportsRepository";
import type { DebtPeriodRow, DebtReportKind } from "./types";

const PAGE_SIZE = 20;

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";
const headerClass =
  "px-3 py-3 text-end text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400";

const sumColumns = (rows: DebtPeriodRow[]) =>
  Object.fromEntries(
    debtColumns.map((column) => [
      column,
      rows.reduce((total, row) => total + row[column], 0),
    ]),
  ) as Record<(typeof debtColumns)[number], number>;

export default function DebtReportView({ kind }: { kind: DebtReportKind }) {
  const { t } = useTranslation();
  const [range, setRange] = useState(defaultDateRange);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<DebtPeriodRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const isRangeValid = isDateRangeValid(range);
  const prefix = `reports.debt.${kind}`;

  useEffect(() => {
    if (!isRangeValid) return;
    let isMounted = true;

    const loadReport = async () => {
      setIsLoading(true);
      setError("");
      setPage(1);

      try {
        const data = await fetchDebtPeriod(kind, range.from, range.to);
        if (isMounted) setRows(data);
      } catch (loadError) {
        if (!isMounted) return;
        setRows([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("reports.debt.errors.load"),
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [isRangeValid, kind, range.from, range.to, t]);

  const filteredRows = useMemo(() => {
    if (!isRangeValid) return [];
    const keyword = search.trim().toLowerCase();

    return rows.filter(
      (row) =>
        !keyword ||
        row.partyName.toLowerCase().includes(keyword) ||
        row.partyCode.toLowerCase().includes(keyword),
    );
  }, [isRangeValid, rows, search]);

  const totals = useMemo(() => sumColumns(filteredRows), [filteredRows]);
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const buildPdfData = (): ReportPdfData => ({
    title: t(`${prefix}.title`),
    companyName: t("reports.pdf.companyName"),
    meta: [t("reports.revenue.pdfPeriod", { from: range.from, to: range.to })],
    columns: [
      { header: t(`${prefix}.party`), flex: 3.5 },
      ...debtColumns.map((column) => ({
        header: t(`reports.debt.table.${column}`),
        flex: 1.6,
        align: "right" as const,
      })),
      { header: t("reports.debt.table.overdueDebt"), flex: 1.2, align: "right" },
    ],
    rows: filteredRows.map((row) => [
      `${row.partyName} (${row.partyCode})`,
      ...debtColumns.map((column) => formatCurrency(row[column])),
      "—",
    ]),
    totals: [
      t("reports.pdf.total"),
      ...debtColumns.map((column) => formatCurrency(totals[column])),
      "—",
    ],
    generatedAtLabel: t("reports.pdf.generatedAt", {
      time: new Date().toLocaleString(),
    }),
    pageLabel: t("reports.pdf.page"),
    landscape: true,
  });

  const summaryCards = [
    { column: "openingDebt", value: totals.openingDebt },
    { column: "debtIncrease", value: totals.debtIncrease },
    { column: "payment", value: totals.payment },
    { column: "closingDebt", value: totals.closingDebt },
  ] as const;

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle={t(`${prefix}.title`)} />

      <ComponentCard title={t(`${prefix}.listTitle`)}>
        <div className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                <span className="mb-1.5 block">{t("reports.documents.filters.from")}</span>
                <input
                  type="date"
                  value={range.from}
                  max={range.to || undefined}
                  onChange={(event) =>
                    setRange((current) => ({ ...current, from: event.target.value }))
                  }
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                <span className="mb-1.5 block">{t("reports.documents.filters.to")}</span>
                <input
                  type="date"
                  value={range.to}
                  min={range.from || undefined}
                  onChange={(event) =>
                    setRange((current) => ({ ...current, to: event.target.value }))
                  }
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                <span className="mb-1.5 block">{t(`${prefix}.search`)}</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  className={fieldClass}
                />
              </label>
            </div>
            <ExportPdfButton
              buildData={buildPdfData}
              fileName={`${kind}-debt-report-${range.from}-${range.to}`}
              disabled={isLoading || filteredRows.length === 0}
            />
          </div>

          {!isRangeValid && (
            <p className="text-sm text-error-600 dark:text-error-400">
              {t("reports.revenue.errors.range")}
            </p>
          )}
          {error && (
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-xl border border-gray-200 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
              {t("reports.loading")}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {t("reports.debt.empty.title")}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("reports.debt.empty.description")}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                  <div
                    key={card.column}
                    className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                      {t(`reports.debt.table.${card.column}`)}
                    </p>
                    <p className="mt-2 text-title-sm font-semibold text-gray-800 dark:text-white/90">
                      {formatCurrency(card.value)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/5">
                      <TableRow>
                        <TableCell
                          isHeader
                          className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
                        >
                          {t(`${prefix}.party`)}
                        </TableCell>
                        {debtColumns.map((column) => (
                          <TableCell key={column} isHeader className={headerClass}>
                            {t(`reports.debt.table.${column}`)}
                          </TableCell>
                        ))}
                        <TableCell isHeader className={headerClass}>
                          {t("reports.debt.table.overdueDebt")}
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                      {pagedRows.map((row) => (
                        <TableRow key={row.partyId}>
                          <TableCell className="px-4 py-4 text-start">
                            <p className="font-medium text-gray-800 dark:text-white/90">
                              {row.partyName}
                            </p>
                            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                              {row.partyCode}
                            </p>
                          </TableCell>
                          {debtColumns.map((column) => (
                            <TableCell
                              key={column}
                              className={`px-3 py-4 text-end text-theme-sm ${
                                column === "closingDebt"
                                  ? "font-semibold text-gray-800 dark:text-white/90"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {formatCurrency(row[column])}
                            </TableCell>
                          ))}
                          <TableCell className="px-3 py-4 text-end text-theme-sm text-gray-400 dark:text-gray-500">
                            —
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <ListPagination
                page={page}
                pageSize={PAGE_SIZE}
                totalItems={filteredRows.length}
                onPageChange={setPage}
              />
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                {t("reports.debt.formula")} {t("reports.debt.overdueNote")}
              </p>
            </>
          )}
        </div>
      </ComponentCard>
    </div>
  );
}
