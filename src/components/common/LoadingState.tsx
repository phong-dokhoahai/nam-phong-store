import { cn } from "@/utils";

interface LoadingStateProps {
  label: string;
  className?: string;
}

/** Placeholder box shown while a list or report is loading. */
export default function LoadingState({ label, className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-xl border border-gray-200 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400",
        className,
      )}
    >
      {label}
    </div>
  );
}
