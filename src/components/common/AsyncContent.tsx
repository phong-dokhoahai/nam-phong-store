import InlineAlert from "@/components/common/InlineAlert";
import LoadingState from "@/components/common/LoadingState";
import TableSkeleton from "@/components/common/TableSkeleton";
import Button from "@/components/ui/button/Button";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface AsyncContentProps {
  isLoading: boolean;
  /** Load failure message; replaces the content with a retry panel. */
  error?: string;
  onRetry?: () => void;
  /** Accessible name announced while loading. */
  loadingLabel: string;
  /** "table" shows skeleton rows, "box" a plain loading box (charts, summaries). */
  placeholder?: "table" | "box";
  children: ReactNode;
}

/**
 * Standard loading → load-error → content switch for a data section, so
 * every screen shows the same skeleton and the same retry panel.
 * Empty results stay the child's job (`EmptyState`).
 */
export default function AsyncContent({
  isLoading,
  error,
  onRetry,
  loadingLabel,
  placeholder = "table",
  children,
}: AsyncContentProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return placeholder === "table" ? (
      <TableSkeleton label={loadingLabel} />
    ) : (
      <LoadingState label={loadingLabel} />
    );
  }

  if (error) {
    return (
      <InlineAlert
        layout="panel"
        action={
          onRetry && (
            <Button variant="errorOutline" size="sm" onClick={onRetry}>
              {t("common.retry")}
            </Button>
          )
        }
      >
        {error}
      </InlineAlert>
    );
  }

  return <>{children}</>;
}
