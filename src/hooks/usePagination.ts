import { useState } from "react";

export const DEFAULT_PAGE_SIZE = 20;

/**
 * Current page that jumps back to 1 whenever `resetKey` changes
 * (e.g. search text or a filter), without a reset effect.
 */
export function useResettablePage(resetKey: string) {
  const [page, setPage] = useState(1);
  const [lastResetKey, setLastResetKey] = useState(resetKey);

  if (lastResetKey !== resetKey) {
    setLastResetKey(resetKey);
    setPage(1);
  }

  return [lastResetKey === resetKey ? page : 1, setPage] as const;
}

/** Client-side paging over an already filtered list. */
export function usePagedItems<T>(
  items: T[],
  resetKey: string,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const [requestedPage, setPage] = useResettablePage(resetKey);
  // Stay on a valid page when the list shrinks (e.g. after a status change).
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requestedPage, pageCount);

  return {
    pageItems: items.slice((page - 1) * pageSize, page * pageSize),
    /** Spread onto `ListPagination`. */
    pagination: {
      page,
      pageSize,
      totalItems: items.length,
      onPageChange: setPage,
    },
  };
}
