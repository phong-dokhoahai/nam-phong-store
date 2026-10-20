import AsyncContent from "@/components/common/AsyncContent";
import EmptyState from "@/components/common/EmptyState";
import FieldError from "@/components/common/FieldError";
import ListPagination from "@/components/common/ListPagination";
import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import StatCard from "@/components/common/StatCard";
import Label from "@/components/form/Label";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePagedItems } from "@/hooks/usePagination";
import { cn } from "@/utils";
import { formatCurrency } from "@/utils/formatCurrency";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import DateRangeFields from "./DateRangeFields";
import { debtColumns } from "./debtColumns";
import ExportPdfButton from "./ExportPdfButton";
import type { ReportPdfData } from "./pdf/ReportPdfDocument";
import { defaultDateRange, isDateRangeValid } from "./reportDates";
import { fetchDebtPeriod } from "./reportsRepository";
import type { DebtPeriodRow, DebtReportKind } from "./types";

const noRows: DebtPeriodRow[] = [];

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

  const isRangeValid = isDateRangeValid(range);
  const prefix = `reports.debt.${kind}`;

  const loadRows = useMemo(
    () =>
      isRangeValid ? () => fetchDebtPeriod(kind, range.from, range.to) : null,
    [isRangeValid, kind, range.from, range.to],
  );
  const {
    data: rows,
    isLoading,
    error,
    reload,
  } = useAsyncData(loadRows, {
    initialData: noRows,
    errorMessage: t("reports.debt.errors.load"),
  });

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
  const paging = usePagedItems(
    filteredRows,
    `${range.from}|${range.to}|${search}`,
  );

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
      {
        header: t("reports.debt.table.overdueDebt"),
        flex: 1.2,
        align: "right",
      },
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
      <PageHeader
        title={t(`${prefix}.title`)}
        description={t(`${prefix}.listTitle`)}
        actions={
          <ExportPdfButton
            buildData={buildPdfData}
            fileName={`${kind}-debt-report-${range.from}-${range.to}`}
            disabled={isLoading || filteredRows.length === 0}
          />
        }
      />

      <section className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-3xl">
          <DateRangeFields value={range} onChange={setRange} />
          <div>
            <Label htmlFor={`${kind}-debt-search`}>
              {t(`${prefix}.search`)}
            </Label>
            <SearchInput
              id={`${kind}-debt-search`}
              value={search}
              onChange={setSearch}
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
          {filteredRows.length === 0 ? (
            <EmptyState
              title={t("reports.debt.empty.title")}
              description={t("reports.debt.empty.description")}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {summaryCards.map((card) => (
                  <StatCard
                    key={card.column}
                    label={t(`reports.debt.table.${card.column}`)}
                    value={formatCurrency(card.value)}
                  />
                ))}
              </div>

              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>{t(`${prefix}.party`)}</TableCell>
                      {debtColumns.map((column) => (
                        <TableCell
                          key={column}
                          isHeader
                          align="end"
                          className="px-3"
                        >
                          {t(`reports.debt.table.${column}`)}
                        </TableCell>
                      ))}
                      <TableCell isHeader align="end" className="px-3">
                        {t("reports.debt.table.overdueDebt")}
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paging.pageItems.map((row) => (
                      <TableRow key={row.partyId}>
                        <TableCell>
                          <p className="font-medium text-fg">{row.partyName}</p>
                          <p className="mt-1 text-theme-xs">{row.partyCode}</p>
                        </TableCell>
                        {debtColumns.map((column) => (
                          <TableCell
                            key={column}
                            align="end"
                            className={cn(
                              "px-3",
                              column === "closingDebt" &&
                                "font-semibold text-fg",
                            )}
                          >
                            {formatCurrency(row[column])}
                          </TableCell>
                        ))}
                        <TableCell
                          align="end"
                          className="px-3 text-gray-400 dark:text-gray-500"
                        >
                          —
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <ListPagination {...paging.pagination} />
              <p className="text-theme-xs text-fg-muted">
                {t("reports.debt.formula")} {t("reports.debt.overdueNote")}
              </p>
            </>
          )}
        </AsyncContent>
      </section>
    </div>
  );
}
