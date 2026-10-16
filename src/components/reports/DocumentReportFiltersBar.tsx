import { useTranslation } from "react-i18next";
import type {
  DocumentReportFilters,
  DocumentReportKind,
  DocumentReportLookups,
  ReportLookup,
} from "./types";

const fieldClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

type DocumentReportFiltersBarProps = {
  kind: DocumentReportKind;
  filters: DocumentReportFilters;
  lookups: DocumentReportLookups;
  onChange: (filters: DocumentReportFilters) => void;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm text-gray-700 dark:text-gray-300">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function LookupSelect({
  value,
  allLabel,
  options,
  onChange,
}: {
  value: string;
  allLabel: string;
  options: ReportLookup[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={fieldClass}
    >
      <option value="">{allLabel}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default function DocumentReportFiltersBar({
  kind,
  filters,
  lookups,
  onChange,
}: DocumentReportFiltersBarProps) {
  const { t } = useTranslation();
  const set = (patch: Partial<DocumentReportFilters>) =>
    onChange({ ...filters, ...patch });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <Field label={t("reports.documents.filters.from")}>
        <input
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(event) => set({ from: event.target.value })}
          className={fieldClass}
        />
      </Field>
      <Field label={t("reports.documents.filters.to")}>
        <input
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          onChange={(event) => set({ to: event.target.value })}
          className={fieldClass}
        />
      </Field>
      <Field label={t(`reports.documents.${kind}.party`)}>
        <LookupSelect
          value={filters.partyId}
          allLabel={t("reports.documents.filters.all")}
          options={lookups.parties}
          onChange={(partyId) => set({ partyId })}
        />
      </Field>
      <Field label={t("reports.documents.filters.material")}>
        <LookupSelect
          value={filters.materialId}
          allLabel={t("reports.documents.filters.all")}
          options={lookups.materials}
          onChange={(materialId) => set({ materialId })}
        />
      </Field>
      <Field label={t(`reports.documents.${kind}.creator`)}>
        <LookupSelect
          value={filters.creatorId}
          allLabel={t("reports.documents.filters.all")}
          options={lookups.creators}
          onChange={(creatorId) => set({ creatorId })}
        />
      </Field>
      <Field label={t("reports.documents.filters.status")}>
        <select
          value={filters.status}
          onChange={(event) =>
            set({ status: event.target.value as DocumentReportFilters["status"] })
          }
          className={fieldClass}
        >
          {(["CONFIRMED", "DRAFT", "CANCELLED", "all"] as const).map((status) => (
            <option key={status} value={status}>
              {t(`reports.documents.status.${status}`)}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
