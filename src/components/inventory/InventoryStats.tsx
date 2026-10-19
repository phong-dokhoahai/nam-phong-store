import StatCard from "@/components/common/StatCard";
import { useTranslation } from "react-i18next";
import { getMaterialStatus } from "@/components/materials/materialStatus";
import type { Material } from "@/components/materials/types";

type InventoryStatsProps = {
  materials: Material[];
};

export default function InventoryStats({ materials }: InventoryStatsProps) {
  const { t } = useTranslation();

  const total = materials.length;
  const inStock = materials.filter(
    (material) => material.currentStock > 0,
  ).length;
  const lowStock = materials.filter(
    (material) => getMaterialStatus(material) === "lowStock",
  ).length;
  const outOfStock = materials.filter(
    (material) => getMaterialStatus(material) === "outOfStock",
  ).length;

  const stats = [
    { label: t("inventory.stats.total"), value: total },
    { label: t("inventory.stats.inStock"), value: inStock },
    { label: t("inventory.stats.lowStock"), value: lowStock },
    { label: t("inventory.stats.outOfStock"), value: outOfStock },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} />
      ))}
    </div>
  );
}
