import { useState } from "react";
import { useTranslation } from "react-i18next";
import { exportReportPdf } from "./pdf/exportReportPdf";
import type { ReportPdfData } from "./pdf/ReportPdfDocument";

type ExportPdfButtonProps = {
  /** Built lazily so the PDF data reflects the current filters. */
  buildData: () => ReportPdfData;
  fileName: string;
  disabled?: boolean;
};

export default function ExportPdfButton({
  buildData,
  fileName,
  disabled,
}: ExportPdfButtonProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    setIsExporting(true);
    setError("");
    try {
      await exportReportPdf(buildData(), fileName);
    } catch {
      setError(t("reports.pdf.error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleExport}
        disabled={disabled || isExporting}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isExporting ? t("reports.pdf.exporting") : t("reports.pdf.export")}
      </button>
      {error && (
        <span className="text-sm text-error-600 dark:text-error-400">
          {error}
        </span>
      )}
    </div>
  );
}
