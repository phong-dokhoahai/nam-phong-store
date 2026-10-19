import ComponentCard from "@/components/common/ComponentCard";
import InlineAlert from "@/components/common/InlineAlert";
import ListPagination from "@/components/common/ListPagination";
import LoadingState from "@/components/common/LoadingState";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SearchInput from "@/components/common/SearchInput";
import { formatQuantity } from "@/components/materials/materialStatus";
import ExportPdfButton from "@/components/reports/ExportPdfButton";
import type { ReportPdfData } from "@/components/reports/pdf/ReportPdfDocument";
import LowStockTable from "@/components/reports/LowStockTable";
import { fetchLowStockReport } from "@/components/reports/reportsRepository";
import type { LowStockRow } from "@/components/reports/types";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 20;

export default function LowStockReport() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<LowStockRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    fetchLowStockReport()
      .then((data) => {
        if (isMounted) setRows(data);
      })
      .catch((loadError) => {
        if (!isMounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("reports.lowStock.errors.load"),
        );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  const keyword = search.trim().toLowerCase();
  const filteredRows = rows.filter(
    (row) =>
      !keyword ||
      row.name.toLowerCase().includes(keyword) ||
      row.sku.toLowerCase().includes(keyword),
  );
  const visibleRows = filteredRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

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
      <PageBreadcrumb pageTitle={t("reports.lowStock.title")} />

      <ComponentCard title={t("reports.lowStock.listTitle")}>
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-sm">
              <SearchInput
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                aria-label={t("reports.lowStock.searchLabel")}
                placeholder={t("reports.lowStock.searchPlaceholder")}
              />
            </div>
            <ExportPdfButton
              buildData={buildPdfData}
              fileName="low-stock-report"
              disabled={isLoading || filteredRows.length === 0}
            />
          </div>

          {error && <InlineAlert>{error}</InlineAlert>}

          {isLoading ? (
            <LoadingState label={t("reports.loading")} />
          ) : (
            <LowStockTable rows={visibleRows} />
          )}
          {!isLoading && (
            <ListPagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={filteredRows.length}
              onPageChange={setPage}
            />
          )}
        </div>
      </ComponentCard>
    </div>
  );
}
