import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import NumberInput from "@/components/form/input/NumberInput";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Modal, ModalFooter, ModalHeader } from "@/components/ui/modal";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Material, MaterialFormValues, MaterialLookup } from "./types";
import InlineAlert from "@/components/common/InlineAlert";
import FieldError from "@/components/common/FieldError";
import { fieldLimits } from "@/utils/validation";
import { validateMaterialForm } from "./materialValidation";

type MaterialFormModalProps = {
  isOpen: boolean;
  material: Material | null;
  categories: MaterialLookup[];
  units: MaterialLookup[];
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (values: MaterialFormValues) => void;
};

const emptyValues: MaterialFormValues = {
  sku: "",
  name: "",
  categoryId: "",
  unitId: "",
  description: "",
  defaultPurchasePrice: 0,
  defaultSalePrice: 0,
  minimumStock: 0,
  isActive: true,
};

const valuesFromMaterial = (material: Material): MaterialFormValues => ({
  sku: material.sku,
  name: material.name,
  categoryId: material.categoryId,
  unitId: material.unitId,
  description: material.description,
  defaultPurchasePrice: material.defaultPurchasePrice,
  defaultSalePrice: material.defaultSalePrice,
  minimumStock: material.minimumStock,
  isActive: material.isActive,
});

export default function MaterialFormModal({
  isOpen,
  material,
  categories,
  units,
  isSaving,
  error,
  onClose,
  onSubmit,
}: MaterialFormModalProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<MaterialFormValues>(() =>
    material ? valuesFromMaterial(material) : emptyValues,
  );
  // Field errors appear after the first submit, then update while typing.
  const [showErrors, setShowErrors] = useState(false);
  const fieldErrors = showErrors ? validateMaterialForm(t, values) : {};
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const title = material
    ? t("materials.form.editTitle")
    : t("materials.form.createTitle");

  // Inactive categories/units cannot be picked, except the one the material
  // already uses (shown with a label so the existing material stays valid).
  const toOptions = useCallback(
    (lookups: MaterialLookup[], currentId: string | undefined) =>
      lookups
        .filter((lookup) => lookup.isActive || lookup.id === currentId)
        .map((lookup) => ({
          value: lookup.id,
          label: lookup.isActive
            ? lookup.name
            : t("materials.form.inactiveOption", { name: lookup.name }),
        })),
    [t],
  );
  const categoryOptions = useMemo(
    () => toOptions(categories, material?.categoryId),
    [categories, material?.categoryId, toOptions],
  );
  const unitOptions = useMemo(
    () => toOptions(units, material?.unitId),
    [units, material?.unitId, toOptions],
  );

  const updateValue = <K extends keyof MaterialFormValues>(
    key: K,
    value: MaterialFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setShowErrors(true);
    if (Object.keys(validateMaterialForm(t, values)).length > 0) return;

    onSubmit(values);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <ModalHeader title={title} description={t("materials.form.subtitle")} />

        {(error || hasFieldErrors) && (
          <InlineAlert>{error || t("validation.fixFields")}</InlineAlert>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="material-sku">{t("materials.form.sku")}</Label>
            <Input
              id="material-sku"
              value={values.sku}
              maxLength={fieldLimits.materialSku}
              error={Boolean(fieldErrors.sku)}
              hint={fieldErrors.sku}
              onChange={(event) => updateValue("sku", event.target.value)}
              placeholder={t("materials.form.skuPlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="material-name">{t("materials.form.name")}</Label>
            <Input
              id="material-name"
              value={values.name}
              maxLength={fieldLimits.materialName}
              error={Boolean(fieldErrors.name)}
              hint={fieldErrors.name}
              onChange={(event) => updateValue("name", event.target.value)}
              placeholder={t("materials.form.namePlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="material-category">
              {t("materials.form.category")}
            </Label>
            <Select
              id="material-category"
              value={values.categoryId}
              placeholder={t("materials.form.categoryPlaceholder")}
              options={categoryOptions}
              error={Boolean(fieldErrors.categoryId)}
              onChange={(value) => updateValue("categoryId", value)}
            />
            {fieldErrors.categoryId && (
              <FieldError className="mt-1.5">{fieldErrors.categoryId}</FieldError>
            )}
          </div>
          <div>
            <Label htmlFor="material-unit">{t("materials.form.unit")}</Label>
            <Select
              id="material-unit"
              value={values.unitId}
              placeholder={t("materials.form.unitPlaceholder")}
              options={unitOptions}
              error={Boolean(fieldErrors.unitId)}
              onChange={(value) => updateValue("unitId", value)}
            />
            {fieldErrors.unitId && (
              <FieldError className="mt-1.5">{fieldErrors.unitId}</FieldError>
            )}
          </div>
          <div>
            <Label htmlFor="material-purchase-price">
              {t("materials.form.purchasePrice")}
            </Label>
            <NumberInput
              id="material-purchase-price"
              kind="money"
              value={values.defaultPurchasePrice}
              onValueChange={(value) =>
                updateValue("defaultPurchasePrice", value)
              }
            />
          </div>
          <div>
            <Label htmlFor="material-sale-price">
              {t("materials.form.salePrice")}
            </Label>
            <NumberInput
              id="material-sale-price"
              kind="money"
              value={values.defaultSalePrice}
              onValueChange={(value) => updateValue("defaultSalePrice", value)}
            />
          </div>
          <div>
            <Label htmlFor="material-minimum-stock">
              {t("materials.form.minimumStock")}
            </Label>
            <NumberInput
              id="material-minimum-stock"
              kind="quantity"
              value={values.minimumStock}
              onValueChange={(value) => updateValue("minimumStock", value)}
            />
          </div>
          <div className="flex items-end pb-3">
            <Checkbox
              checked={values.isActive}
              onChange={(checked) => updateValue("isActive", checked)}
              label={t("materials.form.active")}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="material-description">
              {t("materials.form.description")}
            </Label>
            <TextArea
              id="material-description"
              rows={4}
              value={values.description}
              maxLength={fieldLimits.longText}
              error={Boolean(fieldErrors.description)}
              hint={fieldErrors.description}
              onChange={(value) => updateValue("description", value)}
              placeholder={t("materials.form.descriptionPlaceholder")}
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t("common.close")}
          </Button>
          <Button type="submit" loading={isSaving}>
            {isSaving ? t("materials.form.saving") : t("common.saveChanges")}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
