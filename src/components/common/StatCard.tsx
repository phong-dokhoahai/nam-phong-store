import { cn } from "@/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  className?: string;
}

/** Label + headline number, used in stats rows and report summaries. */
export default function StatCard({ label, value, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3",
        className,
      )}
    >
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-3 text-title-sm font-semibold text-gray-800 dark:text-white/90">
        {value}
      </p>
    </div>
  );
}
