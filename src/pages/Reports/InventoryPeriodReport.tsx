import ComponentCard from "@/components/common/ComponentCard";
import ListPagination from "@/components/common/ListPagination";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { formatQuantity } from "@/components/materials/materialStatus";
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

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

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
        const data = await fetchInventoryPeriod(range.from, range.to, categoryId);
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
              .filter((row) => Math.abs(row.closing - row.currentStock) > 0.0005)
              .map((row) => row.materialId)
          : [],
      ),
    [canReconcile, rows],
  );

  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              <span className="mb-1.5 block">{t("reports.inventoryPeriod.category")}</span>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className={fieldClass}
              >
                <option value="">{t("reports.inventoryPeriod.allCategories")}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              <span className="mb-1.5 block">{t("reports.lowStock.searchLabel")}</span>
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={t("reports.lowStock.searchPlaceholder")}
                className={fieldClass}
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={hideEmpty}
                onChange={(event) => {
                  setHideEmpty(event.target.checked);
                  setPage(1);
                }}
                className="size-4 rounded border-gray-300 text-brand-500 dark:border-gray-700"
              />
              {t("reports.inventoryPeriod.hideEmpty")}
            </label>
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
          {error && (
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          )}
          {!isLoading && mismatchedIds.size > 0 && (
            <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400">
              {t("reports.inventoryPeriod.mismatch", { count: mismatchedIds.size })}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-xl border border-gray-200 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
              {t("reports.loading")}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {t("reports.inventoryPeriod.empty.title")}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("reports.inventoryPeriod.empty.description")}
              </p>
            </div>
          ) : (
            <>
              <InventoryPeriodTable rows={pagedRows} mismatchedIds={mismatchedIds} />
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
