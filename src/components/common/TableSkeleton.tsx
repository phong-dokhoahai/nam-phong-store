interface TableSkeletonProps {
  /** Accessible name announced while loading. */
  label: string;
  rows?: number;
}

const COLUMNS = 5;

/** Grey placeholder rows shown while a list table is loading. */
export default function TableSkeleton({ label, rows = 5 }: TableSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className="rounded-xl border border-line bg-surface p-5"
    >
      <div className="mb-4 h-4 w-40 rounded bg-surface-muted" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.7fr] sm:items-center"
          >
            {Array.from({ length: COLUMNS }).map((__, cellIndex) => (
              <div key={cellIndex} className="h-4 rounded bg-surface-muted" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
