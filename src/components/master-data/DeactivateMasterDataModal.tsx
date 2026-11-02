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

function ConsequenceList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium text-fg">{title}</p>
      <ul className="mt-1.5 list-disc space-y-1 ps-5 text-sm text-fg-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

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
  const listOf = (key: string) => {
    const value = t(`masterData.${kind}.deactivate.${key}`, {
      returnObjects: true,
    });
    return Array.isArray(value) ? value.map(String) : [];
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      tone="danger"
      title={t(`masterData.${kind}.deactivate.title`)}
      description={t(`masterData.${kind}.deactivate.description`, {
        name: record?.name || "",
      })}
      confirmLabel={t(`masterData.${kind}.actions.deactivate`)}
      busyLabel={t([
        `masterData.${kind}.deactivate.deactivating`,
        "masterData.common.deactivate.deactivating",
      ])}
      isBusy={isSaving}
      confirmDisabled={!record}
      error={error}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <div className="space-y-3 rounded-lg border border-line bg-surface-subtle p-4">
        <ConsequenceList
          title={t("masterData.common.deactivate.blockedTitle")}
          items={listOf("blocked")}
        />
        <ConsequenceList
          title={t("masterData.common.deactivate.keptTitle")}
          items={listOf("kept")}
        />
      </div>
    </ConfirmDialog>
  );
}
