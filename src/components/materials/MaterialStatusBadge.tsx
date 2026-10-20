import Badge from "@/components/ui/badge/Badge";
import { useTranslation } from "react-i18next";
import { getMaterialStatus } from "./materialStatus";
import type { Material, MaterialStockStatus } from "./types";

const statusColor: Record<
  MaterialStockStatus,
  "success" | "warning" | "error" | "light"
> = {
  active: "success",
  lowStock: "warning",
  outOfStock: "error",
  inactive: "light",
};

/** Active / low stock / out of stock / inactive pill for a material. */
export default function MaterialStatusBadge({
  material,
}: {
  material: Material;
}) {
  const { t } = useTranslation();
  const status = getMaterialStatus(material);

  return (
    <Badge color={statusColor[status]} size="sm">
      {t(`materials.status.${status}`)}
    </Badge>
  );
}
