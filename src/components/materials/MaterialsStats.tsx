import StatCard from "@/components/common/StatCard";
import { useTranslation } from "react-i18next";
import { getMaterialStatus } from "./materialStatus";
import type { Material, MaterialFilterStatus } from "./types";

type MaterialsStatsProps = {
  materials: Material[];
  /** Current status filter; the matching card shows as pressed. */
  status: MaterialFilterStatus;
  onStatusChange: (status: MaterialFilterStatus) => void;
};

export default function MaterialsStats({
  materials,
  status,
  onStatusChange,
}: MaterialsStatsProps) {
  const { t } = useTranslation();

  const countStatus = (value: MaterialFilterStatus) =>
    materials.filter((material) => getMaterialStatus(material) === value)
      .length;
  const lowStock = countStatus("lowStock");
  const outOfStock = countStatus("outOfStock");
  // Clicking the active card again clears the filter.
  const toggle = (value: MaterialFilterStatus) =>
    onStatusChange(status === value ? "all" : value);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        label={t("materials.stats.total")}
        value={materials.length}
        onClick={() => onStatusChange("all")}
        isActive={status === "all"}
      />
      <StatCard
        label={t("materials.stats.active")}
        value={materials.filter((material) => material.isActive).length}
      />
      <StatCard
        label={t("materials.stats.lowStock")}
        value={lowStock}
        tone={lowStock > 0 ? "warning" : "default"}
        onClick={() => toggle("lowStock")}
        isActive={status === "lowStock"}
      />
      <StatCard
        label={t("materials.stats.outOfStock")}
        value={outOfStock}
        tone={outOfStock > 0 ? "error" : "default"}
        onClick={() => toggle("outOfStock")}
        isActive={status === "outOfStock"}
      />
    </div>
  );
}
