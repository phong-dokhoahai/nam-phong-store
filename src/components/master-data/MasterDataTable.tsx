import EmptyState from "@/components/common/EmptyState";
import Badge from "@/components/ui/badge/Badge";
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
import { useTranslation } from "react-i18next";
import type { MasterDataKind, MasterDataRecord } from "./types";

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
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell isHeader>
              {t("masterData.common.table.record")}
            </TableCell>
            <TableCell isHeader>
              {t(`masterData.${kind}.table.details`)}
            </TableCell>
            <TableCell isHeader>
              {t("masterData.common.table.status")}
            </TableCell>
            <TableCell isHeader align="end">
              {t("masterData.common.table.actions")}
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                <p className="font-medium text-fg">{record.name}</p>
                <p className="mt-1 text-theme-xs">{record.code}</p>
              </TableCell>
              <TableCell className="min-w-64 whitespace-normal">
                {kind === "units" ? (
                  t("masterData.units.table.precision", {
                    value: record.precision ?? 0,
                  })
                ) : isContactKind(kind) ? (
                  <>
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
                  </>
                ) : (
                  record.description ||
                  t("masterData.categories.table.noDescription")
                )}
              </TableCell>
              <TableCell>
                <Badge color={record.isActive ? "success" : "light"} size="sm">
                  {record.isActive
                    ? t([`masterData.${kind}.status.active`, "masterData.common.status.active"])
                    : t([`masterData.${kind}.status.inactive`, "masterData.common.status.inactive"])}
                </Badge>
              </TableCell>
              <TableCell align="end">
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
    </TableContainer>
  );
}
