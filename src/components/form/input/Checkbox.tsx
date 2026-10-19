import { CheckboxCheckDisabledIcon, CheckboxCheckIcon } from "@/icons";
import type React from "react";
import { cn } from "@/utils";

interface CheckboxProps {
  label?: string;
  checked: boolean;
  className?: string;
  id?: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  id,
  onChange,
  className = "",
  disabled = false,
}) => {
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-center gap-3",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div className="relative flex h-5 w-5 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          className={cn(
            "h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 checked:border-transparent checked:bg-brand-500 disabled:opacity-60 dark:border-gray-700",
            className,
          )}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        {checked && (
          <CheckboxCheckIcon className="pointer-events-none absolute inset-0 m-auto" />
        )}
        {disabled && (
          <CheckboxCheckDisabledIcon className="pointer-events-none absolute inset-0 m-auto" />
        )}
      </div>
      {label && (
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;
