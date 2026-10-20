import React from "react";
import { controlClassName, controlHintClassName } from "../controlStyles";

interface TextareaProps {
  id?: string;
  placeholder?: string;
  rows?: number;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
}

const TextArea: React.FC<TextareaProps> = ({
  id,
  placeholder,
  rows = 3,
  value = "",
  onChange,
  className,
  disabled = false,
  error = false,
  hint = "",
}) => {
  const hintId = hint && id ? `${id}-hint` : undefined;

  return (
    <div className="relative">
      <textarea
        id={id}
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        aria-invalid={error || undefined}
        aria-describedby={hintId}
        className={controlClassName({ error, disabled }, className)}
      />
      {hint && (
        <p id={hintId} className={controlHintClassName({ error })}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default TextArea;
