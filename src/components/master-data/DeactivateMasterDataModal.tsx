import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useTranslation } from "react-i18next";
import type { MasterDataKind, MasterDataRecord } from "./types";

type DeactivateMasterDataModalProps = {
  kind: MasterDataKind;
  isOpen: boolean;
  record: MasterDataRecord | null;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeactivateMasterDataModal({
  kind,
  isOpen,
  record,
  isSaving,
  error,
  onClose,
  onConfirm,
}: DeactivateMasterDataModalProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      isOpen={isOpen}
      tone="danger"
      title={t(`masterData.${kind}.deactivate.title`)}
      description={t(`masterData.${kind}.deactivate.description`, {
        name: record?.name || "",
      })}
      confirmLabel={t(`masterData.${kind}.actions.deactivate`)}
      busyLabel={t("masterData.common.deactivate.deactivating")}
      isBusy={isSaving}
      confirmDisabled={!record}
      error={error}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
