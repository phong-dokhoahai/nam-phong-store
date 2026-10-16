import type { DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import type { ReportPdfData } from "./ReportPdfDocument";

/**
 * Renders the report to a PDF and triggers a download.
 * @react-pdf/renderer is browser-heavy, so it is loaded only on demand.
 */
export const exportReportPdf = async (
  data: ReportPdfData,
  fileName: string,
) => {
  const [{ pdf }, { default: ReportPdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./ReportPdfDocument"),
  ]);

  // ReportPdfDocument renders a <Document> at its root.
  const element = createElement(ReportPdfDocument, {
    data,
  }) as unknown as ReactElement<DocumentProps>;
  const blob = await pdf(element).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke later so the browser can start the download first.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
