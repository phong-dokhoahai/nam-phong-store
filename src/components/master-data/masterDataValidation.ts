import type { TFunction } from "i18next";
import { collectErrors, fieldLimits, validateText } from "@/utils/validation";
import type { MasterDataFormValues, MasterDataKind } from "./types";

type MasterDataTextField = Exclude<
  keyof MasterDataFormValues,
  "precision" | "isActive"
>;

export type MasterDataFieldErrors = Partial<Record<MasterDataTextField, string>>;

/** varchar limits of `code` / `name` per table. */
export const masterDataLimits: Record<
  MasterDataKind,
  { code: number; name: number }
> = {
  categories: {
    code: fieldLimits.categoryCode,
    name: fieldLimits.categoryName,
  },
  units: { code: fieldLimits.unitCode, name: fieldLimits.unitName },
  suppliers: { code: fieldLimits.partnerCode, name: fieldLimits.partnerName },
  customers: { code: fieldLimits.partnerCode, name: fieldLimits.partnerName },
};

export const isContactKind = (kind: MasterDataKind) =>
  kind === "customers" || kind === "suppliers";

/** Field errors for categories, units, suppliers and customers. */
export const validateMasterDataForm = (
  t: TFunction,
  kind: MasterDataKind,
  values: MasterDataFormValues,
): MasterDataFieldErrors => {
  const limits = masterDataLimits[kind];
  const contact = isContactKind(kind);

  return collectErrors({
    code: validateText(t, values.code, {
      required: true,
      maxLength: limits.code,
      format: "code",
    }),
    name: validateText(t, values.name, {
      required: true,
      maxLength: limits.name,
    }),
    description:
      kind === "categories"
        ? validateText(t, values.description, {
            maxLength: fieldLimits.longText,
          })
        : "",
    contactName:
      kind === "suppliers"
        ? validateText(t, values.contactName, {
            maxLength: fieldLimits.contactName,
          })
        : "",
    phone: contact
      ? validateText(t, values.phone, {
          maxLength: fieldLimits.phone,
          format: "phone",
        })
      : "",
    email: contact
      ? validateText(t, values.email, {
          maxLength: fieldLimits.email,
          format: "email",
        })
      : "",
    taxCode: contact
      ? validateText(t, values.taxCode, {
          maxLength: fieldLimits.taxCode,
          format: "taxCode",
        })
      : "",
    address: contact
      ? validateText(t, values.address, { maxLength: fieldLimits.longText })
      : "",
    note: contact
      ? validateText(t, values.note, { maxLength: fieldLimits.longText })
      : "",
  });
};
