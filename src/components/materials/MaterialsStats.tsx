import StatCard from "@/components/common/StatCard";
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
        <StatCard key={stat.label} label={stat.label} value={stat.value} />
      ))}
    </div>
  );
}
