import EmptyState from "@/components/common/EmptyState";
import MaterialStatusBadge from "@/components/materials/MaterialStatusBadge";
import type { Material } from "@/components/materials/types";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatQuantity } from "@/utils/formatQuantity";
import { useTranslation } from "react-i18next";

type InventoryTableProps = {
  materials: Material[];
};

export default function InventoryTable({ materials }: InventoryTableProps) {
  const { t } = useTranslation();

  if (materials.length === 0) {
    return (
      <EmptyState
        title={t("inventory.empty.title")}
        description={t("inventory.empty.description")}
      />
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell isHeader>{t("inventory.table.material")}</TableCell>
            <TableCell isHeader>{t("inventory.table.category")}</TableCell>
            <TableCell isHeader align="end">
              {t("inventory.table.currentStock")}
            </TableCell>
            <TableCell isHeader align="end">
              {t("inventory.table.minimumStock")}
            </TableCell>
            <TableCell isHeader>{t("inventory.table.status")}</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((material) => (
            <TableRow key={material.id}>
              <TableCell>
                <p className="font-medium text-fg">{material.name}</p>
                <p className="mt-1 text-theme-xs">{material.sku}</p>
              </TableCell>
              <TableCell>
                <p>{material.categoryName}</p>
                <p className="mt-1 text-theme-xs">{material.unitName}</p>
              </TableCell>
              <TableCell align="end" className="font-medium text-fg">
                {formatQuantity(material.currentStock)} {material.unitName}
              </TableCell>
              <TableCell align="end">
                {formatQuantity(material.minimumStock)} {material.unitName}
              </TableCell>
              <TableCell>
                <MaterialStatusBadge material={material} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
