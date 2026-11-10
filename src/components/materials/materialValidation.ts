import type { TFunction } from "i18next";
import { collectErrors, fieldLimits, validateText } from "@/utils/validation";
import type { MaterialFormValues } from "./types";

export type MaterialFieldErrors = Partial<
  Record<"sku" | "name" | "categoryId" | "unitId" | "description", string>
>;

/**
 * Field errors for the material form. Prices and minimum stock need no check
 * here: `NumberInput` only lets through non-negative values.
 */
export const validateMaterialForm = (
  t: TFunction,
  values: MaterialFormValues,
): MaterialFieldErrors =>
  collectErrors({
    sku: validateText(t, values.sku, {
      required: true,
      maxLength: fieldLimits.materialSku,
      format: "code",
    }),
    name: validateText(t, values.name, {
      required: true,
      maxLength: fieldLimits.materialName,
    }),
    categoryId: values.categoryId ? "" : t("validation.selectRequired"),
    unitId: values.unitId ? "" : t("validation.selectRequired"),
    description: validateText(t, values.description, {
      maxLength: fieldLimits.longText,
    }),
  });
