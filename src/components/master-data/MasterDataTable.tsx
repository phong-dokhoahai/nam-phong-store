import Badge from "@/components/ui/badge/Badge";
import IconButton from "@/components/ui/button/IconButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { useTranslation } from "react-i18next";
import type { MasterDataKind, MasterDataRecord } from "./types";
import EmptyState from "@/components/common/EmptyState";

type MasterDataTableProps = {
  kind: MasterDataKind;
  records: MasterDataRecord[];
  onEdit: (record: MasterDataRecord) => void;
  onDeactivate: (record: MasterDataRecord) => void;
};

const isContactKind = (kind: MasterDataKind) =>
  kind === "customers" || kind === "suppliers";

export default function MasterDataTable({
  kind,
  records,
  onEdit,
  onDeactivate,
}: MasterDataTableProps) {
  const { t } = useTranslation();

  if (records.length === 0) {
    return (
      <EmptyState
        title={t(`masterData.${kind}.empty.title`)}
        description={t(`masterData.${kind}.empty.description`)}
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
                {t("masterData.common.table.record")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t(`masterData.${kind}.table.details`)}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("masterData.common.table.status")}
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 text-end text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
              >
                {t("masterData.common.table.actions")}
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="px-5 py-4 text-start">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white/90">
                      {record.name}
                    </p>
                    <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                      {record.code}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  {kind === "units" ? (
                    <span>
                      {t("masterData.units.table.precision", {
                        value: record.precision ?? 0,
                      })}
                    </span>
                  ) : isContactKind(kind) ? (
                    <div>
                      <p>
                        {record.phone || t("masterData.common.table.noPhone")}
                      </p>
                      <p className="mt-1 text-theme-xs">
                        {record.email || t("masterData.common.table.noEmail")}
                      </p>
                      {kind === "suppliers" && record.contactName && (
                        <p className="mt-1 text-theme-xs">
                          {t("masterData.suppliers.table.contact", {
                            name: record.contactName,
                          })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span>
                      {record.description ||
                        t("masterData.categories.table.noDescription")}
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4 text-start">
                  <Badge
                    color={record.isActive ? "success" : "light"}
                    size="sm"
                  >
                    {record.isActive
                      ? t("masterData.common.status.active")
                      : t("masterData.common.status.inactive")}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-4 text-end">
                  <div className="flex justify-end gap-2">
                    <IconButton
                      icon={<PencilIcon className="size-4" />}
                      label={t(`masterData.${kind}.actions.edit`)}
                      onClick={() => onEdit(record)}
                    />
                    <IconButton
                      icon={<TrashBinIcon className="size-4" />}
                      label={t(`masterData.${kind}.actions.deactivate`)}
                      tone="error"
                      onClick={() => onDeactivate(record)}
                      disabled={!record.isActive || record.isProtected}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
