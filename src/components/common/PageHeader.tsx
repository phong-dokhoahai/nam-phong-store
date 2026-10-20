import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  /** One line explaining what the page is for, or a short summary. */
  description?: ReactNode;
  /** Small status next to the title, e.g. `DataSourceBadge`. */
  meta?: ReactNode;
  /** Page-level actions; the primary action goes last. */
  actions?: ReactNode;
}

/**
 * Top of every app page: the page `<h1>` with its primary action, so the
 * main task is visible without scrolling. Template demo pages keep
 * `PageBreadcrumb`.
 */
export default function PageHeader({
  title,
  description,
  meta,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-xl font-semibold text-fg sm:text-2xl">{title}</h1>
          {meta}
        </div>
        {description && (
          <p className="mt-1 text-sm text-fg-muted">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
