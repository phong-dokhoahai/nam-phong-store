import ComponentCard from "@/components/common/ComponentCard";
import EmptyState from "@/components/common/EmptyState";
import InlineAlert from "@/components/common/InlineAlert";
import ListPagination from "@/components/common/ListPagination";
import LoadingState from "@/components/common/LoadingState";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SearchInput from "@/components/common/SearchInput";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { formatQuantity } from "@/components/materials/materialStatus";
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
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 20;

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
  const [categories, setCategories] = useState<ReportLookup[]>([]);
  const [rows, setRows] = useState<InventoryPeriodRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const isRangeValid = isDateRangeValid(range);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        if (isMounted) setCategories(data);
      } catch {
        // The category filter is optional; the report still works without it.
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isRangeValid) return;
    let isMounted = true;

    const loadReport = async () => {
      setIsLoading(true);
      setError("");
      setPage(1);

      try {
        const data = await fetchInventoryPeriod(
          range.from,
          range.to,
          categoryId,
        );
        if (isMounted) setRows(data);
      } catch (loadError) {
        if (!isMounted) return;
        setRows([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("reports.inventoryPeriod.errors.load"),
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [categoryId, isRangeValid, range.from, range.to, t]);

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

  const pagedRows = filteredRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
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
      <PageBreadcrumb pageTitle={t("reports.inventoryPeriod.title")} />

      <ComponentCard title={t("reports.inventoryPeriod.listTitle")}>
        <div className="space-y-5">
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
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                placeholder={t("reports.lowStock.searchPlaceholder")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Checkbox
              id="inventory-report-hide-empty"
              checked={hideEmpty}
              onChange={(checked) => {
                setHideEmpty(checked);
                setPage(1);
              }}
              label={t("reports.inventoryPeriod.hideEmpty")}
            />
            <ExportPdfButton
              buildData={buildPdfData}
              fileName={`inventory-report-${range.from}-${range.to}`}
              disabled={isLoading || filteredRows.length === 0}
            />
          </div>

          {!isRangeValid && (
            <p className="text-sm text-error-600 dark:text-error-400">
              {t("reports.revenue.errors.range")}
            </p>
          )}
          {error && <InlineAlert>{error}</InlineAlert>}
          {!isLoading && mismatchedIds.size > 0 && (
            <InlineAlert variant="warning">
              {t("reports.inventoryPeriod.mismatch", {
                count: mismatchedIds.size,
              })}
            </InlineAlert>
          )}

          {isLoading ? (
            <LoadingState label={t("reports.loading")} />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              title={t("reports.inventoryPeriod.empty.title")}
              description={t("reports.inventoryPeriod.empty.description")}
            />
          ) : (
            <>
              <InventoryPeriodTable
                rows={pagedRows}
                mismatchedIds={mismatchedIds}
              />
              <ListPagination
                page={page}
                pageSize={PAGE_SIZE}
                totalItems={filteredRows.length}
                onPageChange={setPage}
              />
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                {t("reports.inventoryPeriod.formula")}
              </p>
            </>
          )}
        </div>
      </ComponentCard>
    </div>
  );
}
