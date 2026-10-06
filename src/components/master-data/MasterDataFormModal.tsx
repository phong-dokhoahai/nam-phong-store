import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  MasterDataFormValues,
  MasterDataKind,
  MasterDataRecord,
} from "./types";

type MasterDataFormModalProps = {
  kind: MasterDataKind;
  isOpen: boolean;
  record: MasterDataRecord | null;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (values: MasterDataFormValues) => void;
};

const emptyValues: MasterDataFormValues = {
  code: "",
  name: "",
  description: "",
  precision: 0,
  contactName: "",
  phone: "",
  email: "",
  address: "",
  taxCode: "",
  note: "",
  isActive: true,
};

const valuesFromRecord = (record: MasterDataRecord): MasterDataFormValues => ({
  code: record.code,
  name: record.name,
  description: record.description,
  precision: record.precision ?? 0,
  contactName: record.contactName,
  phone: record.phone,
  email: record.email,
  address: record.address,
  taxCode: record.taxCode,
  note: record.note,
  isActive: record.isActive,
});

const isContactKind = (kind: MasterDataKind) =>
  kind === "customers" || kind === "suppliers";

export default function MasterDataFormModal({
  kind,
  isOpen,
  record,
  isSaving,
  error,
  onClose,
  onSubmit,
}: MasterDataFormModalProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<MasterDataFormValues>(() =>
    record ? valuesFromRecord(record) : emptyValues,
  );
  const [localError, setLocalError] = useState("");
  const title = record
    ? t(`masterData.${kind}.form.editTitle`)
    : t(`masterData.${kind}.form.createTitle`);

  const updateValue = <K extends keyof MasterDataFormValues>(
    key: K,
    value: MasterDataFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.code.trim() || !values.name.trim()) {
      setLocalError(t("masterData.common.form.requiredError"));
      return;
    }

    if (kind === "units" && (values.precision < 0 || values.precision > 3)) {
      setLocalError(t("masterData.units.form.precisionError"));
      return;
    }

    onSubmit(values);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t(`masterData.${kind}.form.subtitle`)}
          </p>
        </div>

        {(error || localError) && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
            {error || localError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor={`${kind}-code`}>
              {t("masterData.common.form.code")}
            </Label>
            <Input
              id={`${kind}-code`}
              value={values.code}
              onChange={(event) => updateValue("code", event.target.value)}
              placeholder={t(`masterData.${kind}.form.codePlaceholder`)}
              disabled={Boolean(record?.isProtected)}
            />
          </div>
          <div>
            <Label htmlFor={`${kind}-name`}>
              {t("masterData.common.form.name")}
            </Label>
            <Input
              id={`${kind}-name`}
              value={values.name}
              onChange={(event) => updateValue("name", event.target.value)}
              placeholder={t(`masterData.${kind}.form.namePlaceholder`)}
            />
          </div>
          {kind === "units" ? (
            <div>
              <Label>{t("masterData.units.form.precision")}</Label>
              <Select
                key={`precision-${values.precision}`}
                defaultValue={String(values.precision)}
                options={[0, 1, 2, 3].map((precision) => ({
                  value: String(precision),
                  label: t("masterData.units.form.precisionOption", {
                    value: precision,
                  }),
                }))}
                onChange={(value) => updateValue("precision", Number(value))}
              />
            </div>
          ) : isContactKind(kind) ? (
            <>
              {kind === "suppliers" && (
                <div>
                  <Label htmlFor={`${kind}-contact-name`}>
                    {t("masterData.suppliers.form.contactName")}
                  </Label>
                  <Input
                    id={`${kind}-contact-name`}
                    value={values.contactName}
                    onChange={(event) =>
                      updateValue("contactName", event.target.value)
                    }
                    placeholder={t(
                      "masterData.suppliers.form.contactNamePlaceholder",
                    )}
                  />
                </div>
              )}
              <div>
                <Label htmlFor={`${kind}-phone`}>
                  {t("masterData.common.form.phone")}
                </Label>
                <Input
                  id={`${kind}-phone`}
                  value={values.phone}
                  onChange={(event) => updateValue("phone", event.target.value)}
                  placeholder={t(`masterData.${kind}.form.phonePlaceholder`)}
                />
              </div>
              <div>
                <Label htmlFor={`${kind}-email`}>
                  {t("masterData.common.form.email")}
                </Label>
                <Input
                  id={`${kind}-email`}
                  type="email"
                  value={values.email}
                  onChange={(event) => updateValue("email", event.target.value)}
                  placeholder={t(`masterData.${kind}.form.emailPlaceholder`)}
                />
              </div>
              <div>
                <Label htmlFor={`${kind}-tax-code`}>
                  {t("masterData.common.form.taxCode")}
                </Label>
                <Input
                  id={`${kind}-tax-code`}
                  value={values.taxCode}
                  onChange={(event) =>
                    updateValue("taxCode", event.target.value)
                  }
                  placeholder={t(`masterData.${kind}.form.taxCodePlaceholder`)}
                />
              </div>
              <div className="md:col-span-2">
                <Label>{t("masterData.common.form.address")}</Label>
                <TextArea
                  rows={3}
                  value={values.address}
                  onChange={(value) => updateValue("address", value)}
                  placeholder={t(`masterData.${kind}.form.addressPlaceholder`)}
                />
              </div>
              <div className="md:col-span-2">
                <Label>{t("masterData.common.form.note")}</Label>
                <TextArea
                  rows={3}
                  value={values.note}
                  onChange={(value) => updateValue("note", value)}
                  placeholder={t(`masterData.${kind}.form.notePlaceholder`)}
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <Label>{t("masterData.categories.form.description")}</Label>
              <TextArea
                rows={4}
                value={values.description}
                onChange={(value) => updateValue("description", value)}
                placeholder={t(
                  "masterData.categories.form.descriptionPlaceholder",
                )}
              />
            </div>
          )}
          <div className="flex items-end pb-3">
            <Checkbox
              checked={values.isActive}
              onChange={(checked) => updateValue("isActive", checked)}
              label={t("masterData.common.form.active")}
              disabled={Boolean(record?.isProtected)}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving
              ? t("masterData.common.form.saving")
              : t("common.saveChanges")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
