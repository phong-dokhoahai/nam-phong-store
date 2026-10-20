import AsyncContent from "@/components/common/AsyncContent";
import FilterToolbar from "@/components/common/FilterToolbar";
import ListPagination from "@/components/common/ListPagination";
import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import ExportPdfButton from "@/components/reports/ExportPdfButton";
import type { ReportPdfData } from "@/components/reports/pdf/ReportPdfDocument";
import LowStockTable from "@/components/reports/LowStockTable";
import { fetchLowStockReport } from "@/components/reports/reportsRepository";
import type { LowStockRow } from "@/components/reports/types";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePagedItems } from "@/hooks/usePagination";
import { formatQuantity } from "@/utils/formatQuantity";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const noRows: LowStockRow[] = [];

export default function LowStockReport() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const {
    data: rows,
    isLoading,
    error,
    reload,
  } = useAsyncData(fetchLowStockReport, {
    initialData: noRows,
    errorMessage: t("reports.lowStock.errors.load"),
  });

  const keyword = search.trim().toLowerCase();
  const filteredRows = rows.filter(
    (row) =>
      !keyword ||
      row.name.toLowerCase().includes(keyword) ||
      row.sku.toLowerCase().includes(keyword),
  );
  const paging = usePagedItems(filteredRows, search);

  const buildPdfData = (): ReportPdfData => ({
    title: t("reports.lowStock.title"),
    companyName: t("reports.pdf.companyName"),
    meta: [t("reports.pdf.items", { count: filteredRows.length })],
    columns: [
      { header: t("reports.lowStock.table.material"), flex: 3 },
      { header: t("reports.lowStock.table.category"), flex: 2 },
      {
        header: t("reports.lowStock.table.currentStock"),
        flex: 1.5,
        align: "right",
      },
      {
        header: t("reports.lowStock.table.minimumStock"),
        flex: 1.5,
        align: "right",
      },
      {
        header: t("reports.lowStock.table.shortage"),
        flex: 1.5,
        align: "right",
      },
      { header: t("reports.lowStock.table.status"), flex: 1.5 },
    ],
    rows: filteredRows.map((row) => [
      `${row.name} (${row.sku})`,
      row.categoryName,
      `${formatQuantity(row.currentStock)} ${row.unitName}`,
      `${formatQuantity(row.minimumStock)} ${row.unitName}`,
      `${formatQuantity(row.shortageQuantity)} ${row.unitName}`,
      t(
        row.isOutOfStock
          ? "reports.lowStock.status.outOfStock"
          : "reports.lowStock.status.lowStock",
      ),
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
        title={t("reports.lowStock.title")}
        description={t("reports.lowStock.listTitle")}
        actions={
          <ExportPdfButton
            buildData={buildPdfData}
            fileName="low-stock-report"
            disabled={isLoading || filteredRows.length === 0}
          />
        }
      />

      <section className="space-y-4">
        <FilterToolbar
          search={
            <SearchInput
              value={search}
              onChange={setSearch}
              aria-label={t("reports.lowStock.searchLabel")}
              placeholder={t("reports.lowStock.searchPlaceholder")}
            />
          }
        />

        <AsyncContent
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          loadingLabel={t("reports.loading")}
        >
          <LowStockTable rows={paging.pageItems} />
          <ListPagination {...paging.pagination} />
        </AsyncContent>
      </section>
    </div>
  );
}
