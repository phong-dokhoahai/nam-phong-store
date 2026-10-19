import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { DateRange } from "./reportDates";

type DateRangeFieldsProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
};

/** "From" / "To" date inputs shared by every period report. */
export default function DateRangeFields({
  value,
  onChange,
}: DateRangeFieldsProps) {
  const { t } = useTranslation();
  const id = useId();

  return (
    <>
      <div>
        <Label htmlFor={`${id}-from`}>
          {t("reports.documents.filters.from")}
        </Label>
        <Input
          id={`${id}-from`}
          type="date"
          value={value.from}
          max={value.to || undefined}
          onChange={(event) => onChange({ ...value, from: event.target.value })}
        />
      </div>
      <div>
        <Label htmlFor={`${id}-to`}>{t("reports.documents.filters.to")}</Label>
        <Input
          id={`${id}-to`}
          type="date"
          value={value.to}
          min={value.from || undefined}
          onChange={(event) => onChange({ ...value, to: event.target.value })}
        />
      </div>
    </>
  );
}
