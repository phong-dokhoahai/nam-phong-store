import { cn } from "@/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  /** Shorter box for empty sections inside a form (e.g. no lines yet). */
  compact?: boolean;
  /** Optional call to action, e.g. a "create" button. */
  action?: ReactNode;
  className?: string;
}

/** Dashed box shown when a list, table or report has no rows. */
export default function EmptyState({
  title,
  description,
  compact = false,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-gray-300 px-6 text-center dark:border-gray-700",
        compact ? "py-10" : "py-12",
        className,
      )}
    >
      {title && (
        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
          {title}
        </p>
      )}
      {description && (
        <p
          className={cn(
            "text-sm text-gray-500 dark:text-gray-400",
            title && "mt-1",
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
