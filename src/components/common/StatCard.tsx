import { cn } from "@/utils";
import type { ReactNode } from "react";

type StatTone = "default" | "warning" | "error";

interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Colors the value when it needs attention (e.g. low / out of stock). */
  tone?: StatTone;
  /** Makes the card a filter toggle for the list below it. */
  onClick?: () => void;
  /** Pressed state when the card acts as a filter. */
  isActive?: boolean;
  className?: string;
}

const toneClasses: Record<StatTone, string> = {
  default: "text-fg",
  warning: "text-warning-600 dark:text-warning-400",
  error: "text-error-600 dark:text-error-400",
};

/** Label + headline number for summary rows; optionally filters the list. */
export default function StatCard({
  label,
  value,
  tone = "default",
  onClick,
  isActive = false,
  className,
}: StatCardProps) {
  const content = (
    <>
      <span className="block text-sm text-fg-muted">{label}</span>
      <span
        className={cn(
          "mt-1 block text-2xl font-semibold tabular-nums",
          toneClasses[tone],
        )}
      >
        {value}
      </span>
    </>
  );
  const frame = "rounded-xl border bg-surface px-4 py-3 text-start";

  if (!onClick) {
    return <div className={cn(frame, "border-line", className)}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        frame,
        "w-full transition-colors hover:border-brand-300 focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-none dark:hover:border-brand-700",
        isActive
          ? "border-brand-500 ring-1 ring-brand-500 dark:border-brand-400 dark:ring-brand-400"
          : "border-line",
        className,
      )}
    >
      {content}
    </button>
  );
}
