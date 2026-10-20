import StatCard from "@/components/common/StatCard";
import { getMaterialStatus } from "@/components/materials/materialStatus";
import type {
  Material,
  MaterialFilterStatus,
} from "@/components/materials/types";
import { useTranslation } from "react-i18next";

type InventoryStatsProps = {
  materials: Material[];
  /** Current status filter; the matching card shows as pressed. */
  status: MaterialFilterStatus;
  onStatusChange: (status: MaterialFilterStatus) => void;
};

export default function InventoryStats({
  materials,
  status,
  onStatusChange,
}: InventoryStatsProps) {
  const { t } = useTranslation();

  const countStatus = (value: MaterialFilterStatus) =>
    materials.filter((material) => getMaterialStatus(material) === value)
      .length;
  const inStock = materials.filter(
    (material) => material.currentStock > 0,
  ).length;
  const lowStock = countStatus("lowStock");
  const outOfStock = countStatus("outOfStock");
  // Clicking the active card again clears the filter.
  const toggle = (value: MaterialFilterStatus) =>
    onStatusChange(status === value ? "all" : value);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        label={t("inventory.stats.total")}
        value={materials.length}
        onClick={() => onStatusChange("all")}
        isActive={status === "all"}
      />
      <StatCard label={t("inventory.stats.inStock")} value={inStock} />
      <StatCard
        label={t("inventory.stats.lowStock")}
        value={lowStock}
        tone={lowStock > 0 ? "warning" : "default"}
        onClick={() => toggle("lowStock")}
        isActive={status === "lowStock"}
      />
      <StatCard
        label={t("inventory.stats.outOfStock")}
        value={outOfStock}
        tone={outOfStock > 0 ? "error" : "default"}
        onClick={() => toggle("outOfStock")}
        isActive={status === "outOfStock"}
      />
    </div>
  );
}
