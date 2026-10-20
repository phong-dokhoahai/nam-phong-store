import { cn } from "@/utils";
import type { ReactNode } from "react";

/** Short validation message next to a field or filter group. */
export default function FieldError({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      role="alert"
      className={cn("text-sm text-error-600 dark:text-error-400", className)}
    >
      {children}
    </p>
  );
}
