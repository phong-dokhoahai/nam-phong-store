import { useTranslation } from "react-i18next";

type ListPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

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
      className="flex flex-col gap-3 border-t border-gray-100 pt-4 text-sm dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="text-gray-500 dark:text-gray-400">
        {t("common.pagination.range", {
          from: firstItem,
          to: lastItem,
          total: totalItems,
        })}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-gray-300 px-3 py-2 text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
        >
          {t("common.pagination.previous")}
        </button>
        <span aria-live="polite" className="min-w-20 text-center text-gray-600 dark:text-gray-300">
          {t("common.pagination.page", { page, pages: pageCount })}
        </span>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-gray-300 px-3 py-2 text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
        >
          {t("common.pagination.next")}
        </button>
      </div>
    </nav>
  );
}
