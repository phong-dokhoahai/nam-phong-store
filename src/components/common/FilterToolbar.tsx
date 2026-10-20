import { Children, type ReactNode } from "react";

interface FilterToolbarProps {
  /** Search box; gets the widest slot. */
  search?: ReactNode;
  /** Filter controls (`Select`s…), one fixed-width slot each. */
  children?: ReactNode;
  /** Trailing content, e.g. an export button or a toggle. */
  actions?: ReactNode;
}

/**
 * Row above a list: search and filters on the start side, secondary actions
 * on the end side. Stacks on mobile, single row from `lg`.
 */
export default function FilterToolbar({
  search,
  children,
  actions,
}: FilterToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {search && <div className="sm:w-72">{search}</div>}
        {Children.map(children, (child) =>
          child ? <div className="sm:w-52">{child}</div> : null,
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
