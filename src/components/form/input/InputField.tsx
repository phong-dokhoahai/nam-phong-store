import type React from "react";
import type { FC } from "react";
import { cn } from "@/utils";
import { controlClassName, controlHintClassName } from "../controlStyles";

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "success" | "error" | "hint" | "step"
> {
  success?: boolean;
  error?: boolean;
  hint?: string;
  step?: number;
}

const Input: FC<InputProps> = ({
  type = "text",
  className,
  disabled = false,
  success = false,
  error = false,
  hint,
  ...props
}) => {
  const hintId = hint && props.id ? `${props.id}-hint` : undefined;

  return (
    <div className="relative">
      <input
        type={type}
        disabled={disabled}
        aria-invalid={error || undefined}
        aria-describedby={hintId}
        className={controlClassName(
          { error, success, disabled },
          cn("h-11 appearance-none", className),
        )}
        {...props}
      />

      {hint && (
        <p id={hintId} className={controlHintClassName({ error, success })}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;
