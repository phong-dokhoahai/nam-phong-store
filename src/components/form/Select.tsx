import { ChevronDownIcon } from "@/icons";
import { cn } from "@/utils";
import { useState } from "react";
import { controlClassName } from "./controlStyles";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  /** Shown as a disabled first option when nothing is selected. */
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  /**
   * Controlled value. When provided, the parent owns the selection and the
   * component re-renders on every change (no `key` remount needed).
   */
  value?: string;
  /** Initial value for uncontrolled usage. Ignored when `value` is set. */
  defaultValue?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  error?: boolean;
  "aria-label"?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder,
  onChange,
  className = "",
  value,
  defaultValue = "",
  id,
  name,
  disabled = false,
  error = false,
  "aria-label": ariaLabel,
}) => {
  const [internalValue, setInternalValue] = useState<string>(defaultValue);
  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value : internalValue;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isControlled) setInternalValue(event.target.value);
    onChange(event.target.value);
  };

  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        disabled={disabled}
        className={controlClassName(
          { error, disabled },
          cn(
            "h-11 appearance-none pe-11",
            // Grey only while the placeholder is showing; "" may be a real option.
            placeholder !== undefined &&
              !selectedValue &&
              "text-gray-400 dark:text-gray-400",
            className,
          ),
        )}
        value={selectedValue}
        onChange={handleChange}
      >
        {placeholder !== undefined && (
          <option
            value=""
            disabled
            className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute inset-e-3 top-1/2 size-5 -translate-y-1/2 text-gray-700 dark:text-gray-400" />
    </div>
  );
};

export default Select;
