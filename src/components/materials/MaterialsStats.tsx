import { useTranslation } from "react-i18next";
import { getMaterialStatus } from "./materialStatus";
import type { Material } from "./types";

type MaterialsStatsProps = {
  materials: Material[];
};

export default function MaterialsStats({ materials }: MaterialsStatsProps) {
  const { t } = useTranslation();
  const total = materials.length;
  const active = materials.filter((material) => material.isActive).length;
  const lowStock = materials.filter(
    (material) => getMaterialStatus(material) === "lowStock",
  ).length;
  const outOfStock = materials.filter(
    (material) => getMaterialStatus(material) === "outOfStock",
  ).length;

  const stats = [
    { label: t("materials.stats.total"), value: total },
    { label: t("materials.stats.active"), value: active },
    { label: t("materials.stats.lowStock"), value: lowStock },
    { label: t("materials.stats.outOfStock"), value: outOfStock },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {stat.label}
          </p>
          <p className="mt-2 text-title-sm font-semibold text-gray-800 dark:text-white/90">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
