/**
 * Text <-> number rules for `form/input/NumberInput`.
 *
 * - money: whole VND. "." and "," are thousand separators and are dropped,
 *   so a pasted "1.000.000" becomes 1000000.
 * - quantity: "," or "." is the decimal separator (shown as ","), at most
 *   `decimals` digits after it.
 *
 * Both strip leading zeros ("0001" -> "1", "00,5" -> "0,5"), reject signs,
 * exponents and any other character, and cap the integer part so the value
 * stays a safe JS integer and fits `numeric(18,3)` / `bigint` in the database.
 */

export type NumberInputKind = "money" | "quantity";

export const MAX_INTEGER_DIGITS = 12;
export const MAX_QUANTITY_DECIMALS = 3;

const stripLeadingZeros = (digits: string) => digits.replace(/^0+(?=\d)/, "");

/**
 * Cleans what the user typed. Returns `null` when the edit must be rejected
 * (the input then keeps its previous text), otherwise the text to show.
 */
export const sanitizeNumberText = (
  raw: string,
  kind: NumberInputKind,
  decimals: number = MAX_QUANTITY_DECIMALS,
): string | null => {
  const text = raw.trim();
  if (text === "") return "";

  if (kind === "money") {
    if (/[^\d.,\s]/.test(text)) return null;
    const digits = stripLeadingZeros(text.replace(/\D/g, ""));
    return digits.length > MAX_INTEGER_DIGITS ? null : digits;
  }

  if (/[^\d.,]/.test(text)) return null;
  const normalized = text.replace(/\./g, ",");
  const parts = normalized.split(",");
  if (parts.length > 2) return null;

  const [integerPart, fractionPart] = parts;
  if (fractionPart !== undefined && decimals <= 0) return null;
  if (fractionPart !== undefined && fractionPart.length > decimals) return null;

  const integerDigits = stripLeadingZeros(integerPart) || "0";
  if (integerDigits.length > MAX_INTEGER_DIGITS) return null;

  // Keep an empty integer part empty while the user types ",5" -> "0,5".
  return fractionPart === undefined
    ? stripLeadingZeros(integerPart)
    : `${integerDigits},${fractionPart}`;
};

/** "" -> 0, "1,5" -> 1.5, "0," -> 0. */
export const parseNumberText = (text: string) => {
  if (text === "") return 0;
  const value = Number(text.replace(",", "."));
  return Number.isFinite(value) ? value : 0;
};

/** Text shown while editing a stored value: 1.5 -> "1,5". */
export const toEditableNumberText = (value: number) =>
  Number.isFinite(value) ? String(value).replace(".", ",") : "";

/** Number of digits after the decimal point (1.25 -> 2). */
export const countDecimals = (value: number) => {
  if (!Number.isFinite(value) || Number.isInteger(value)) return 0;
  const [, fraction = ""] = String(value).split(".");
  return fraction.length;
};

/** True when `value` is a whole VND amount (tolerates float noise). */
export const isWholeAmount = (value: number) =>
  Math.abs(value - Math.round(value)) < 1e-6;
