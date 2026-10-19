import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatQuantity,
  getMaterialStatus,
} from "@/components/materials/materialStatus";
import type {
  Material,
  MaterialStockStatus,
} from "@/components/materials/types";
import { useTranslation } from "react-i18next";
import EmptyState from "@/components/common/EmptyState";

type InventoryTableProps = {
  materials: Material[];
};

const statusColor: Record<
  MaterialStockStatus,
  "success" | "warning" | "error" | "light"
> = {
  active: "success",
  lowStock: "warning",
  outOfStock: "error",
  inactive: "light",
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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/5">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("inventory.table.material")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("inventory.table.category")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("inventory.table.currentStock")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("inventory.table.minimumStock")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("inventory.table.status")}
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {materials.map((material) => {
              const status = getMaterialStatus(material);

              return (
                <TableRow key={material.id}>
                  <TableCell className="px-5 py-4 text-start">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {material.name}
                      </p>
                      <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                        {material.sku}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <p>{material.categoryName}</p>
                      <p className="mt-1 text-theme-xs">{material.unitName}</p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {formatQuantity(material.currentStock)} {material.unitName}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    {formatQuantity(material.minimumStock)} {material.unitName}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-start">
                    <Badge color={statusColor[status]} size="sm">
                      {t(`materials.status.${status}`)}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
