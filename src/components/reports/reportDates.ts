const pad = (value: number) => String(value).padStart(2, "0");

/** Local calendar date as YYYY-MM-DD (matches Postgres `date` columns). */
export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export type DateRange = { from: string; to: string };

/** Last 30 days including today. */
export const defaultDateRange = (): DateRange => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: toIsoDate(from), to: toIsoDate(to) };
};

export const isDateRangeValid = (range: DateRange) =>
  Boolean(range.from && range.to && range.from <= range.to);
