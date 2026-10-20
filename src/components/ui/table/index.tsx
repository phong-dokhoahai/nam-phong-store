import type { ReactNode } from "react";

import { cn } from "@/utils";

/*
  Data table primitives. The default look (frame, header band, compact rows,
  row hover, tabular figures) lives here; feature tables only describe columns
  and content. Pass `className` to adjust a single table or cell.
*/

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableSectionProps {
  children: ReactNode;
  className?: string;
}

interface TableCellProps {
  children?: ReactNode;
  /** Renders a `<th>` with header typography. */
  isHeader?: boolean;
  /** Logical alignment; use "end" for amounts, quantities and actions. */
  align?: "start" | "center" | "end";
  className?: string;
  colSpan?: number;
}

const alignClasses = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
};

/** Bordered, horizontally scrollable frame around a `Table`. */
const TableContainer: React.FC<TableSectionProps> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      "overflow-hidden rounded-xl border border-line bg-surface",
      className,
    )}
  >
    <div className="max-w-full overflow-x-auto">{children}</div>
  </div>
);

const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <table className={cn("min-w-full tabular-nums", className)}>
      {children}
    </table>
  );
};

const TableHeader: React.FC<TableSectionProps> = ({ children, className }) => {
  return (
    <thead className={cn("border-b border-line bg-surface-subtle", className)}>
      {children}
    </thead>
  );
};

const TableBody: React.FC<TableSectionProps> = ({ children, className }) => {
  return (
    <tbody
      className={cn(
        "divide-y divide-line-subtle [&>tr]:transition-colors [&>tr:hover]:bg-surface-subtle",
        className,
      )}
    >
      {children}
    </tbody>
  );
};

const TableRow: React.FC<TableSectionProps> = ({ children, className }) => {
  return <tr className={className}>{children}</tr>;
};

const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  align = "start",
  className,
  colSpan,
}) => {
  const CellTag = isHeader ? "th" : "td";
  return (
    <CellTag
      colSpan={colSpan}
      className={cn(
        "px-4",
        isHeader
          ? "py-2.5 text-xs font-medium whitespace-nowrap text-fg-muted"
          : // Codes, dates and amounts must not break; the container scrolls.
            // Long free text opts out with `whitespace-normal`.
            "py-3 text-sm whitespace-nowrap text-fg-muted",
        alignClasses[align],
        className,
      )}
    >
      {children}
    </CellTag>
  );
};

export { Table, TableBody, TableCell, TableContainer, TableHeader, TableRow };
