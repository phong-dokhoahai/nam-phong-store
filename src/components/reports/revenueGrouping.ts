import type {
  DailySalesRow,
  RevenueGroupBy,
  RevenuePeriodRow,
} from "./types";

const pad = (value: number) => String(value).padStart(2, "0");

/** Monday of the week containing the given YYYY-MM-DD date (UTC-safe). */
const weekStart = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const offset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

const periodKey = (date: string, groupBy: RevenueGroupBy) => {
  if (groupBy === "week") return weekStart(date);
  if (groupBy === "month") return date.slice(0, 7);
  return date;
};

export const groupRevenue = (
  rows: DailySalesRow[],
  groupBy: RevenueGroupBy,
): RevenuePeriodRow[] => {
  const periods = new Map<string, RevenuePeriodRow>();

  for (const row of rows) {
    const key = periodKey(row.date, groupBy);
    const current = periods.get(key);

    if (!current) {
      periods.set(key, { ...row, key, date: key });
      continue;
    }

    current.orderCount += row.orderCount;
    current.subtotal += row.subtotal;
    current.discountAmount += row.discountAmount;
    current.shippingAndTax += row.shippingAndTax;
    current.totalAmount += row.totalAmount;
    current.returnCount += row.returnCount;
    current.returnAmount += row.returnAmount;
    current.netRevenue += row.netRevenue;
  }

  return [...periods.values()].sort((a, b) => a.key.localeCompare(b.key));
};

export const sumRevenue = (rows: RevenuePeriodRow[]) =>
  rows.reduce(
    (total, row) => ({
      orderCount: total.orderCount + row.orderCount,
      totalAmount: total.totalAmount + row.totalAmount,
      returnAmount: total.returnAmount + row.returnAmount,
      netRevenue: total.netRevenue + row.netRevenue,
      discountAmount: total.discountAmount + row.discountAmount,
    }),
    {
      orderCount: 0,
      totalAmount: 0,
      returnAmount: 0,
      netRevenue: 0,
      discountAmount: 0,
    },
  );
