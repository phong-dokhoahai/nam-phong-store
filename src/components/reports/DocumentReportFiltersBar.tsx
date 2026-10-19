import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { useTranslation } from "react-i18next";
import DateRangeFields from "./DateRangeFields";
import type {
  DocumentReportFilters,
  DocumentReportKind,
  DocumentReportLookups,
  ReportLookup,
} from "./types";

type DocumentReportFiltersBarProps = {
  kind: DocumentReportKind;
  filters: DocumentReportFilters;
  lookups: DocumentReportLookups;
  onChange: (filters: DocumentReportFilters) => void;
};

const STATUSES = ["CONFIRMED", "DRAFT", "CANCELLED", "all"] as const;

const toOptions = (allLabel: string, items: ReportLookup[]) => [
  { value: "", label: allLabel },
  ...items.map((item) => ({ value: item.id, label: item.label })),
];

export default function DocumentReportFiltersBar({
  kind,
  filters,
  lookups,
  onChange,
}: DocumentReportFiltersBarProps) {
  const { t } = useTranslation();
  const set = (patch: Partial<DocumentReportFilters>) =>
    onChange({ ...filters, ...patch });
  const allLabel = t("reports.documents.filters.all");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <DateRangeFields
        value={{ from: filters.from, to: filters.to }}
        onChange={set}
      />
      <div>
        <Label htmlFor="report-party">
          {t(`reports.documents.${kind}.party`)}
        </Label>
        <Select
          id="report-party"
          value={filters.partyId}
          options={toOptions(allLabel, lookups.parties)}
          onChange={(partyId) => set({ partyId })}
        />
      </div>
      <div>
        <Label htmlFor="report-material">
          {t("reports.documents.filters.material")}
        </Label>
        <Select
          id="report-material"
          value={filters.materialId}
          options={toOptions(allLabel, lookups.materials)}
          onChange={(materialId) => set({ materialId })}
        />
      </div>
      <div>
        <Label htmlFor="report-creator">
          {t(`reports.documents.${kind}.creator`)}
        </Label>
        <Select
          id="report-creator"
          value={filters.creatorId}
          options={toOptions(allLabel, lookups.creators)}
          onChange={(creatorId) => set({ creatorId })}
        />
      </div>
      <div>
        <Label htmlFor="report-status">
          {t("reports.documents.filters.status")}
        </Label>
        <Select
          id="report-status"
          value={filters.status}
          options={STATUSES.map((status) => ({
            value: status,
            label: t(`reports.documents.status.${status}`),
          }))}
          onChange={(status) =>
            set({ status: status as DocumentReportFilters["status"] })
          }
        />
      </div>
    </div>
  );
}
