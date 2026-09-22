import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { useTranslation } from "react-i18next";
import {
  formatCurrency,
  formatQuantity,
  getMaterialStatus,
} from "./materialStatus";
import type { Material, MaterialStockStatus } from "./types";

type MaterialsTableProps = {
  materials: Material[];
  onEdit: (material: Material) => void;
  onDeactivate: (material: Material) => void;
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

export default function MaterialsTable({
  materials,
  onEdit,
  onDeactivate,
}: MaterialsTableProps) {
  const { t } = useTranslation();

  if (materials.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
          {t("materials.empty.title")}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("materials.empty.description")}
        </p>
      </div>
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
                {t("materials.table.material")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("materials.table.category")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("materials.table.stock")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("materials.table.prices")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("materials.table.status")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-end text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("materials.table.actions")}
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
                  <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <p>
                        {formatQuantity(material.currentStock)}{" "}
                        {material.unitName}
                      </p>
                      <p className="mt-1 text-theme-xs">
                        {t("materials.table.minimum", {
                          value: formatQuantity(material.minimumStock),
                        })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <p>{formatCurrency(material.defaultSalePrice)}</p>
                      <p className="mt-1 text-theme-xs">
                        {t("materials.table.purchase", {
                          value: formatCurrency(
                            material.defaultPurchasePrice,
                          ),
                        })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-start">
                    <Badge color={statusColor[status]} size="sm">
                      {t(`materials.status.${status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-end">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(material)}
                        aria-label={t("materials.actions.edit")}
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-500 dark:border-gray-800 dark:text-gray-400 dark:hover:border-brand-700"
                      >
                        <PencilIcon className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeactivate(material)}
                        aria-label={t("materials.actions.deactivate")}
                        disabled={!material.isActive}
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-error-300 hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-800 dark:text-gray-400 dark:hover:border-error-700"
                      >
                        <TrashBinIcon className="size-4" />
                      </button>
                    </div>
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
