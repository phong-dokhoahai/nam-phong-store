import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { useTranslation } from "react-i18next";
import type { RevenuePeriodRow } from "./types";

export default function RevenueChart({ rows }: { rows: RevenuePeriodRow[] }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 280,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        columnWidth: "45%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: rows.map((row) => row.key),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (value: number) =>
          new Intl.NumberFormat(locale, { notation: "compact" }).format(value),
      },
    },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      y: {
        formatter: (value: number) =>
          new Intl.NumberFormat(locale).format(value),
      },
    },
  };

  return (
    <div className="custom-scrollbar max-w-full overflow-x-auto">
      <div className="min-w-150">
        <Chart
          options={options}
          series={[
            {
              name: t("reports.revenue.table.netRevenue"),
              data: rows.map((row) => row.netRevenue),
            },
          ]}
          type="bar"
          height={280}
        />
      </div>
    </div>
  );
}
