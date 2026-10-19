import Button from "@/components/ui/button/Button";
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
      <Button
        size="sm"
        onClick={handleExport}
        disabled={disabled}
        loading={isExporting}
      >
        {isExporting ? t("reports.pdf.exporting") : t("reports.pdf.export")}
      </Button>
      {error && (
        <span className="text-sm text-error-600 dark:text-error-400">
          {error}
        </span>
      )}
    </div>
  );
}
