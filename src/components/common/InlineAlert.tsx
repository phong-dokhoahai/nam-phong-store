import { cn } from "@/utils";
import type { ReactNode } from "react";

type InlineAlertVariant = "error" | "warning" | "success" | "info";

interface InlineAlertProps {
  variant?: InlineAlertVariant;
  children: ReactNode;
  /**
   * "inline" for a one-line message above a form or table;
   * "panel" for a centered block that replaces content (e.g. load failure).
   */
  layout?: "inline" | "panel";
  /** Optional action rendered under the message, e.g. a retry button. */
  action?: ReactNode;
  className?: string;
}

const variantClasses: Record<InlineAlertVariant, string> = {
  error:
    "border-error-200 bg-error-50 text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400",
  warning:
    "border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400",
  success:
    "border-success-200 bg-success-50 text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-400",
  info: "border-blue-light-200 bg-blue-light-50 text-blue-light-700 dark:border-blue-light-500/20 dark:bg-blue-light-500/10 dark:text-blue-light-400",
};

/**
 * Compact message box. Use `ui/alert/Alert` instead when the message needs a
 * title, an icon and a "learn more" link.
 */
export default function InlineAlert({
  variant = "error",
  children,
  layout = "inline",
  action,
  className,
}: InlineAlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "border text-sm",
        variantClasses[variant],
        layout === "panel"
          ? "rounded-xl px-6 py-8 text-center font-medium"
          : "rounded-lg px-4 py-3",
        className,
      )}
    >
      {children}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
