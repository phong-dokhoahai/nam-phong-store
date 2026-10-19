import { ChevronDownIcon } from "@/icons";
import { cn } from "@/utils";
import { useState } from "react";

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
        className={cn(
          "h-11 w-full appearance-none rounded-lg border bg-transparent px-4 py-2.5 pe-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:bg-gray-900 dark:placeholder:text-white/30",
          error
            ? "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:border-error-500"
            : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800",
          selectedValue
            ? "text-gray-800 dark:text-white/90"
            : "text-gray-400 dark:text-gray-400",
          disabled && "cursor-not-allowed opacity-50",
          className,
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
