import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  Material,
  MaterialFormValues,
  MaterialLookup,
} from "./types";

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
  const [localError, setLocalError] = useState("");
  const title = material
    ? t("materials.form.editTitle")
    : t("materials.form.createTitle");

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    [categories],
  );
  const unitOptions = useMemo(
    () => units.map((unit) => ({ value: unit.id, label: unit.name })),
    [units],
  );

  const updateValue = <K extends keyof MaterialFormValues>(
    key: K,
    value: MaterialFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const updateNumber = (
    key: "defaultPurchasePrice" | "defaultSalePrice" | "minimumStock",
    value: string,
  ) => {
    updateValue(key, Math.max(0, Number(value || 0)));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.sku.trim() || !values.name.trim()) {
      setLocalError(t("materials.form.requiredError"));
      return;
    }

    if (!values.categoryId || !values.unitId) {
      setLocalError(t("materials.form.lookupError"));
      return;
    }

    onSubmit(values);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-6 lg:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("materials.form.subtitle")}
          </p>
        </div>

        {(error || localError) && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
            {error || localError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="material-sku">{t("materials.form.sku")}</Label>
            <Input
              id="material-sku"
              value={values.sku}
              onChange={(event) => updateValue("sku", event.target.value)}
              placeholder={t("materials.form.skuPlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="material-name">{t("materials.form.name")}</Label>
            <Input
              id="material-name"
              value={values.name}
              onChange={(event) => updateValue("name", event.target.value)}
              placeholder={t("materials.form.namePlaceholder")}
            />
          </div>
          <div>
            <Label>{t("materials.form.category")}</Label>
            <Select
              key={`category-${values.categoryId}`}
              defaultValue={values.categoryId}
              placeholder={t("materials.form.categoryPlaceholder")}
              options={categoryOptions}
              onChange={(value) => updateValue("categoryId", value)}
            />
          </div>
          <div>
            <Label>{t("materials.form.unit")}</Label>
            <Select
              key={`unit-${values.unitId}`}
              defaultValue={values.unitId}
              placeholder={t("materials.form.unitPlaceholder")}
              options={unitOptions}
              onChange={(value) => updateValue("unitId", value)}
            />
          </div>
          <div>
            <Label htmlFor="material-purchase-price">
              {t("materials.form.purchasePrice")}
            </Label>
            <Input
              id="material-purchase-price"
              type="number"
              min="0"
              value={values.defaultPurchasePrice}
              onChange={(event) =>
                updateNumber("defaultPurchasePrice", event.target.value)
              }
            />
          </div>
          <div>
            <Label htmlFor="material-sale-price">
              {t("materials.form.salePrice")}
            </Label>
            <Input
              id="material-sale-price"
              type="number"
              min="0"
              value={values.defaultSalePrice}
              onChange={(event) =>
                updateNumber("defaultSalePrice", event.target.value)
              }
            />
          </div>
          <div>
            <Label htmlFor="material-minimum-stock">
              {t("materials.form.minimumStock")}
            </Label>
            <Input
              id="material-minimum-stock"
              type="number"
              min="0"
              step={0.001}
              value={values.minimumStock}
              onChange={(event) =>
                updateNumber("minimumStock", event.target.value)
              }
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
            <Label>{t("materials.form.description")}</Label>
            <TextArea
              rows={4}
              value={values.description}
              onChange={(value) => updateValue("description", value)}
              placeholder={t("materials.form.descriptionPlaceholder")}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? t("materials.form.saving") : t("common.saveChanges")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
