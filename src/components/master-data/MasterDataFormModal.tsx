import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Modal, ModalFooter, ModalHeader } from "@/components/ui/modal";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  MasterDataFormValues,
  MasterDataKind,
  MasterDataRecord,
} from "./types";
import InlineAlert from "@/components/common/InlineAlert";
import { fieldLimits } from "@/utils/validation";
import {
  isContactKind,
  masterDataLimits,
  validateMasterDataForm,
} from "./masterDataValidation";

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
  // Field errors appear after the first submit, then update while typing.
  const [showErrors, setShowErrors] = useState(false);
  const fieldErrors = showErrors
    ? validateMasterDataForm(t, kind, values)
    : {};
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const limits = masterDataLimits[kind];
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

    setShowErrors(true);
    if (Object.keys(validateMasterDataForm(t, kind, values)).length > 0) {
      return;
    }

    onSubmit(values);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <ModalHeader
          title={title}
          description={t(`masterData.${kind}.form.subtitle`)}
        />

        {(error || hasFieldErrors) && (
          <InlineAlert>{error || t("validation.fixFields")}</InlineAlert>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor={`${kind}-code`}>
              {t("masterData.common.form.code")}
            </Label>
            <Input
              id={`${kind}-code`}
              value={values.code}
              maxLength={limits.code}
              error={Boolean(fieldErrors.code)}
              hint={fieldErrors.code}
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
              maxLength={limits.name}
              error={Boolean(fieldErrors.name)}
              hint={fieldErrors.name}
              onChange={(event) => updateValue("name", event.target.value)}
              placeholder={t(`masterData.${kind}.form.namePlaceholder`)}
            />
          </div>
          {kind === "units" ? (
            <div>
              <Label htmlFor={`${kind}-precision`}>
                {t("masterData.units.form.precision")}
              </Label>
              <Select
                id={`${kind}-precision`}
                value={String(values.precision)}
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
                    maxLength={fieldLimits.contactName}
                    error={Boolean(fieldErrors.contactName)}
                    hint={fieldErrors.contactName}
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
                  type="tel"
                  inputMode="tel"
                  value={values.phone}
                  maxLength={fieldLimits.phone}
                  error={Boolean(fieldErrors.phone)}
                  hint={fieldErrors.phone}
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
                  maxLength={fieldLimits.email}
                  error={Boolean(fieldErrors.email)}
                  hint={fieldErrors.email}
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
                  maxLength={fieldLimits.taxCode}
                  error={Boolean(fieldErrors.taxCode)}
                  hint={fieldErrors.taxCode}
                  onChange={(event) =>
                    updateValue("taxCode", event.target.value)
                  }
                  placeholder={t(`masterData.${kind}.form.taxCodePlaceholder`)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor={`${kind}-address`}>
                  {t("masterData.common.form.address")}
                </Label>
                <TextArea
                  id={`${kind}-address`}
                  rows={3}
                  value={values.address}
                  maxLength={fieldLimits.longText}
                  error={Boolean(fieldErrors.address)}
                  hint={fieldErrors.address}
                  onChange={(value) => updateValue("address", value)}
                  placeholder={t(`masterData.${kind}.form.addressPlaceholder`)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor={`${kind}-note`}>
                  {t("masterData.common.form.note")}
                </Label>
                <TextArea
                  id={`${kind}-note`}
                  rows={3}
                  value={values.note}
                  maxLength={fieldLimits.longText}
                  error={Boolean(fieldErrors.note)}
                  hint={fieldErrors.note}
                  onChange={(value) => updateValue("note", value)}
                  placeholder={t(`masterData.${kind}.form.notePlaceholder`)}
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <Label htmlFor={`${kind}-description`}>
                {t("masterData.categories.form.description")}
              </Label>
              <TextArea
                id={`${kind}-description`}
                rows={4}
                value={values.description}
                maxLength={fieldLimits.longText}
                error={Boolean(fieldErrors.description)}
                hint={fieldErrors.description}
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
              label={t([`masterData.${kind}.form.active`, "masterData.common.form.active"])}
              disabled={Boolean(record?.isProtected)}
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t("common.close")}
          </Button>
          <Button type="submit" loading={isSaving}>
            {isSaving
              ? t("masterData.common.form.saving")
              : t("common.saveChanges")}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
