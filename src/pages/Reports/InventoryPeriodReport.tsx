import AsyncContent from "@/components/common/AsyncContent";
import EmptyState from "@/components/common/EmptyState";
import FieldError from "@/components/common/FieldError";
import InlineAlert from "@/components/common/InlineAlert";
import ListPagination from "@/components/common/ListPagination";
import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import DateRangeFields from "@/components/reports/DateRangeFields";
import ExportPdfButton from "@/components/reports/ExportPdfButton";
import InventoryPeriodTable from "@/components/reports/InventoryPeriodTable";
import { inventoryPeriodColumns } from "@/components/reports/inventoryPeriodColumns";
import type { ReportPdfData } from "@/components/reports/pdf/ReportPdfDocument";
import {
  defaultDateRange,
  isDateRangeValid,
  toIsoDate,
} from "@/components/reports/reportDates";
import {
  fetchCategories,
  fetchInventoryPeriod,
} from "@/components/reports/reportsRepository";
import type {
  InventoryPeriodRow,
  ReportLookup,
} from "@/components/reports/types";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePagedItems } from "@/hooks/usePagination";
import { formatQuantity } from "@/utils/formatQuantity";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const noRows: InventoryPeriodRow[] = [];
const noCategories: ReportLookup[] = [];

const hasMovement = (row: InventoryPeriodRow) =>
  row.opening !== 0 ||
  row.closing !== 0 ||
  inventoryPeriodColumns.some((column) => row[column] !== 0);

export default function InventoryPeriodReport() {
  const { t } = useTranslation();
  const [range, setRange] = useState(defaultDateRange);
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [hideEmpty, setHideEmpty] = useState(true);

  const isRangeValid = isDateRangeValid(range);

  // The category filter is optional: its load error is ignored and the
  // report still works with "all categories".
  const { data: categories } = useAsyncData(fetchCategories, {
    initialData: noCategories,
    errorMessage: "",
  });

  const loadReport = useMemo(
    () =>
      isRangeValid
        ? () => fetchInventoryPeriod(range.from, range.to, categoryId)
        : null,
    [categoryId, isRangeValid, range.from, range.to],
  );
  const {
    data: rows,
    isLoading,
    error,
    reload,
  } = useAsyncData(loadReport, {
    initialData: noRows,
    errorMessage: t("reports.inventoryPeriod.errors.load"),
  });

  const filteredRows = useMemo(() => {
    if (!isRangeValid) return [];
    const keyword = search.trim().toLowerCase();

    return rows.filter(
      (row) =>
        (!hideEmpty || hasMovement(row)) &&
        (!keyword ||
          row.name.toLowerCase().includes(keyword) ||
          row.sku.toLowerCase().includes(keyword)),
    );
  }, [hideEmpty, isRangeValid, rows, search]);

  // Reconciliation only makes sense when the period reaches today: later
  // movements would otherwise legitimately differ from current stock.
  const canReconcile = range.to >= toIsoDate(new Date());
  const mismatchedIds = useMemo(
    () =>
      new Set(
        canReconcile
          ? rows
              .filter(
                (row) => Math.abs(row.closing - row.currentStock) > 0.0005,
              )
              .map((row) => row.materialId)
          : [],
      ),
    [canReconcile, rows],
  );

  const paging = usePagedItems(
    filteredRows,
    `${range.from}|${range.to}|${categoryId}|${search}|${hideEmpty}`,
  );

  const buildPdfData = (): ReportPdfData => ({
    title: t("reports.inventoryPeriod.title"),
    companyName: t("reports.pdf.companyName"),
    meta: [
      t("reports.revenue.pdfPeriod", { from: range.from, to: range.to }),
      categories.find((category) => category.id === categoryId)?.label ??
        t("reports.inventoryPeriod.allCategories"),
    ],
    columns: [
      { header: t("reports.inventoryPeriod.table.material"), flex: 3.5 },
      { header: t("reports.inventoryPeriod.table.unit"), flex: 1 },
      ...inventoryPeriodColumns.map((column) => ({
        header: t(`reports.inventoryPeriod.table.${column}`),
        flex: 1.3,
        align: "right" as const,
      })),
    ],
    rows: filteredRows.map((row) => [
      `${row.name} (${row.sku})`,
      row.unitName,
      ...inventoryPeriodColumns.map((column) => formatQuantity(row[column])),
    ]),
    generatedAtLabel: t("reports.pdf.generatedAt", {
      time: new Date().toLocaleString(),
    }),
    pageLabel: t("reports.pdf.page"),
    landscape: true,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("reports.inventoryPeriod.title")}
        description={t("reports.inventoryPeriod.listTitle")}
        actions={
          <ExportPdfButton
            buildData={buildPdfData}
            fileName={`inventory-report-${range.from}-${range.to}`}
            disabled={isLoading || filteredRows.length === 0}
          />
        }
      />

      <section className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DateRangeFields value={range} onChange={setRange} />
          <div>
            <Label htmlFor="inventory-report-category">
              {t("reports.inventoryPeriod.category")}
            </Label>
            <Select
              id="inventory-report-category"
              value={categoryId}
              onChange={setCategoryId}
              options={[
                {
                  value: "",
                  label: t("reports.inventoryPeriod.allCategories"),
                },
                ...categories.map((category) => ({
                  value: category.id,
                  label: category.label,
                })),
              ]}
            />
          </div>
          <div>
            <Label htmlFor="inventory-report-search">
              {t("reports.lowStock.searchLabel")}
            </Label>
            <SearchInput
              id="inventory-report-search"
              value={search}
              onChange={setSearch}
              placeholder={t("reports.lowStock.searchPlaceholder")}
            />
          </div>
        </div>

        <Checkbox
          id="inventory-report-hide-empty"
          checked={hideEmpty}
          onChange={setHideEmpty}
          label={t("reports.inventoryPeriod.hideEmpty")}
        />

        {!isRangeValid && (
          <FieldError>{t("reports.revenue.errors.range")}</FieldError>
        )}
        {!isLoading && mismatchedIds.size > 0 && (
          <InlineAlert variant="warning">
            {t("reports.inventoryPeriod.mismatch", {
              count: mismatchedIds.size,
            })}
          </InlineAlert>
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
              title={t("reports.inventoryPeriod.empty.title")}
              description={t("reports.inventoryPeriod.empty.description")}
            />
          ) : (
            <>
              <InventoryPeriodTable
                rows={paging.pageItems}
                mismatchedIds={mismatchedIds}
              />
              <ListPagination {...paging.pagination} />
              <p className="text-theme-xs text-fg-muted">
                {t("reports.inventoryPeriod.formula")}
              </p>
            </>
          )}
        </AsyncContent>
      </section>
    </div>
  );
}
