import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";

type ListPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

/** "Showing x–y of z" + previous/next. Renders nothing for a single page. */
export default function ListPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: ListPaginationProps) {
  const { t } = useTranslation();
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label={t("common.pagination.label")}
      className="flex flex-col gap-3 border-t border-line-subtle pt-4 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="text-fg-muted">
        {t("common.pagination.range", {
          from: firstItem,
          to: lastItem,
          total: totalItems,
        })}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t("common.pagination.previous")}
        </Button>
        <span aria-live="polite" className="min-w-20 text-center text-fg-muted">
          {t("common.pagination.page", { page, pages: pageCount })}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          {t("common.pagination.next")}
        </Button>
      </div>
    </nav>
  );
}
