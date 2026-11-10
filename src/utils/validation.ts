import type { TFunction } from "i18next";

/**
 * Text length limits mirroring the varchar columns in
 * `supabase/migrations/202609180002_create_master_tables.sql` and
 * `202609180003_create_document_tables.sql`. Free-text columns are `text` in
 * the database; `longText` is a UI limit so a note stays readable.
 */
export const fieldLimits = {
  categoryCode: 50,
  categoryName: 150,
  unitCode: 30,
  unitName: 100,
  partnerCode: 50,
  partnerName: 200,
  contactName: 150,
  phone: 30,
  email: 255,
  taxCode: 50,
  materialSku: 80,
  materialName: 200,
  supplierInvoiceNumber: 100,
  referenceNumber: 150,
  longText: 1000,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits with an optional leading "+", once spaces, dots, dashes and
// parentheses are removed: "0901 234 567", "+84 (28) 3823-4567".
const PHONE_PATTERN = /^\+?\d{8,15}$/;
// Vietnamese tax code: 10 digits, 10 digits + "-" + 3 digits (branch), or the
// 12-digit personal ID used as tax code for household businesses.
const TAX_CODE_PATTERN = /^(\d{10}(-\d{3})?|\d{12})$/;
// Codes are saved upper-case: letters, digits, ".", "_", "-".
const CODE_PATTERN = /^[A-Z0-9][A-Z0-9._-]*$/;

export const isValidEmail = (value: string) => EMAIL_PATTERN.test(value.trim());

export const isValidPhone = (value: string) =>
  PHONE_PATTERN.test(value.trim().replace(/[\s.()-]/g, ""));

export const isValidTaxCode = (value: string) =>
  TAX_CODE_PATTERN.test(value.trim());

export const isValidCode = (value: string) =>
  CODE_PATTERN.test(value.trim().toUpperCase());

type TextRule = {
  required?: boolean;
  maxLength: number;
  format?: "email" | "phone" | "taxCode" | "code";
};

const formatChecks = {
  email: isValidEmail,
  phone: isValidPhone,
  taxCode: isValidTaxCode,
  code: isValidCode,
} as const;

/** Returns the translated error for one text field, or "" when valid. */
export const validateText = (
  t: TFunction,
  value: string,
  { required = false, maxLength, format }: TextRule,
) => {
  const trimmed = value.trim();
  if (!trimmed) return required ? t("validation.required") : "";
  if (trimmed.length > maxLength) {
    return t("validation.maxLength", { max: maxLength });
  }
  if (format && !formatChecks[format](trimmed)) {
    return t(`validation.${format}`);
  }
  return "";
};

/** Keeps only the fields that have an error. */
export const collectErrors = <K extends string>(
  errors: Record<K, string>,
): Partial<Record<K, string>> =>
  Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message)),
  ) as Partial<Record<K, string>>;
