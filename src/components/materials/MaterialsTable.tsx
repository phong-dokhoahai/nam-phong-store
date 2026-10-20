import EmptyState from "@/components/common/EmptyState";
import IconButton from "@/components/ui/button/IconButton";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatQuantity } from "@/utils/formatQuantity";
import { useTranslation } from "react-i18next";
import MaterialStatusBadge from "./MaterialStatusBadge";
import type { Material } from "./types";

type MaterialsTableProps = {
  materials: Material[];
  onEdit: (material: Material) => void;
  onDeactivate: (material: Material) => void;
};

export default function MaterialsTable({
  materials,
  onEdit,
  onDeactivate,
}: MaterialsTableProps) {
  const { t } = useTranslation();

  if (materials.length === 0) {
    return (
      <EmptyState
        title={t("materials.empty.title")}
        description={t("materials.empty.description")}
      />
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell isHeader>{t("materials.table.material")}</TableCell>
            <TableCell isHeader>{t("materials.table.category")}</TableCell>
            <TableCell isHeader align="end">
              {t("materials.table.stock")}
            </TableCell>
            <TableCell isHeader align="end">
              {t("materials.table.prices")}
            </TableCell>
            <TableCell isHeader>{t("materials.table.status")}</TableCell>
            <TableCell isHeader align="end">
              {t("materials.table.actions")}
            </TableCell>
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
              <TableCell align="end">
                <p className="font-medium text-fg">
                  {formatQuantity(material.currentStock)} {material.unitName}
                </p>
                <p className="mt-1 text-theme-xs">
                  {t("materials.table.minimum", {
                    value: formatQuantity(material.minimumStock),
                  })}
                </p>
              </TableCell>
              <TableCell align="end">
                <p className="font-medium text-fg">
                  {formatCurrency(material.defaultSalePrice)}
                </p>
                <p className="mt-1 text-theme-xs">
                  {t("materials.table.purchase", {
                    value: formatCurrency(material.defaultPurchasePrice),
                  })}
                </p>
              </TableCell>
              <TableCell>
                <MaterialStatusBadge material={material} />
              </TableCell>
              <TableCell align="end">
                <div className="flex justify-end gap-2">
                  <IconButton
                    icon={<PencilIcon className="size-4" />}
                    label={t("materials.actions.edit")}
                    onClick={() => onEdit(material)}
                  />
                  <IconButton
                    icon={<TrashBinIcon className="size-4" />}
                    label={t("materials.actions.deactivate")}
                    tone="error"
                    onClick={() => onDeactivate(material)}
                    disabled={!material.isActive}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
