import type React from "react";
import { useRef, useState } from "react";
import { formatQuantity } from "@/utils/formatQuantity";
import {
  MAX_QUANTITY_DECIMALS,
  parseNumberText,
  sanitizeNumberText,
  toEditableNumberText,
  type NumberInputKind,
} from "@/utils/numberInput";
import Input from "./InputField";

type InputFieldProps = React.ComponentProps<typeof Input>;

interface NumberInputProps extends Omit<
  InputFieldProps,
  "type" | "value" | "onChange" | "step" | "min" | "max" | "inputMode"
> {
  value: number;
  onValueChange: (value: number) => void;
  /** money: whole VND; quantity: up to `decimals` decimals. */
  kind: NumberInputKind;
  /** Max decimals for a quantity (the unit's precision). Ignored for money. */
  decimals?: number;
}

const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

/**
 * Numeric text box for money and quantities. Unlike `<input type="number">`
 * it never shows text that differs from the stored value ("0001", "05"),
 * rejects signs/exponents, ignores the mouse wheel, and shows the value with
 * thousand separators when not focused. Focusing selects the whole value so a
 * new number can be typed over it. Empty means 0.
 */
export default function NumberInput({
  value,
  onValueChange,
  kind,
  decimals = MAX_QUANTITY_DECIMALS,
  onFocus,
  onBlur,
  onMouseUp,
  onKeyDown,
  ...props
}: NumberInputProps) {
  const [text, setText] = useState(() => toEditableNumberText(value));
  const [syncedValue, setSyncedValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  // The click that focused the input must not undo the select-all on mouseup.
  const keepSelectionOnMouseUp = useRef(false);

  // The parent changed the value (reset, material picked, draft loaded):
  // show it, unless it is what the current text already means.
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (parseNumberText(text) !== value) setText(toEditableNumberText(value));
  }

  const maxDecimals = kind === "money" ? 0 : decimals;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = sanitizeNumberText(event.target.value, kind, maxDecimals);
    if (next === null) return;

    const nextValue = parseNumberText(next);
    setText(next);
    setSyncedValue(nextValue);
    if (nextValue !== value) onValueChange(nextValue);
  };

  const formatted =
    kind === "money" ? moneyFormatter.format(value) : formatQuantity(value);

  return (
    <Input
      {...props}
      type="text"
      inputMode={kind === "money" || maxDecimals === 0 ? "numeric" : "decimal"}
      autoComplete="off"
      value={isFocused || text === "" ? text : formatted}
      onChange={handleChange}
      onFocus={(event) => {
        setIsFocused(true);
        keepSelectionOnMouseUp.current = true;
        // Select after the text switches from "12.500" to "12500".
        const input = event.currentTarget;
        requestAnimationFrame(() => input.select());
        onFocus?.(event);
      }}
      onMouseUp={(event) => {
        if (keepSelectionOnMouseUp.current) event.preventDefault();
        keepSelectionOnMouseUp.current = false;
        onMouseUp?.(event);
      }}
      onKeyDown={(event) => {
        keepSelectionOnMouseUp.current = false;
        // Block an invalid character before it reaches the DOM, so the
        // selection survives ("-" typed over a selected value changes
        // nothing). Pastes and virtual keyboards are cleaned in handleChange.
        const input = event.currentTarget;
        if (
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          const start = input.selectionStart ?? input.value.length;
          const end = input.selectionEnd ?? input.value.length;
          const next =
            input.value.slice(0, start) + event.key + input.value.slice(end);
          if (sanitizeNumberText(next, kind, maxDecimals) === null) {
            event.preventDefault();
          }
        }
        onKeyDown?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        keepSelectionOnMouseUp.current = false;
        // Drop a dangling separator: "1," -> "1".
        setText(text === "" ? "" : toEditableNumberText(parseNumberText(text)));
        onBlur?.(event);
      }}
    />
  );
}
