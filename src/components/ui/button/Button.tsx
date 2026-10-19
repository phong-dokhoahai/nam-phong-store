import { cn } from "@/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  "primary" | "outline" | "danger" | "successOutline" | "errorOutline";

interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  children: ReactNode;
  size?: "sm" | "md";
  variant?: ButtonVariant;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  /** Disables the button and marks it busy; pass the busy label as children. */
  loading?: boolean;
}

const sizeClasses = {
  sm: "px-4 py-2.5 text-sm",
  md: "px-5 py-3 text-sm",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
  outline:
    "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/3 dark:hover:text-gray-300",
  danger:
    "bg-error-500 text-white shadow-theme-xs hover:bg-error-600 disabled:bg-error-300",
  successOutline:
    "text-success-600 ring-1 ring-inset ring-success-300 hover:bg-success-50 dark:text-success-400 dark:ring-success-500/40 dark:hover:bg-success-500/10",
  errorOutline:
    "text-error-600 ring-1 ring-inset ring-error-300 hover:bg-error-100 dark:text-error-400 dark:ring-error-500/40 dark:hover:bg-error-500/10",
};

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  type = "button",
  className = "",
  disabled = false,
  loading = false,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition",
        sizeClasses[size],
        variantClasses[variant],
        isDisabled && "cursor-not-allowed opacity-50",
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
