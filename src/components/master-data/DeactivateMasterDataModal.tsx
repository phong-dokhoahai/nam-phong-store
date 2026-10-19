import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useTranslation } from "react-i18next";
import type { MasterDataKind, MasterDataRecord } from "./types";
import InlineAlert from "@/components/common/InlineAlert";

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
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6 lg:p-8">
      <div className="space-y-5">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {t(`masterData.${kind}.deactivate.title`)}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t(`masterData.${kind}.deactivate.description`, {
              name: record?.name || "",
            })}
          </p>
        </div>

        {error && <InlineAlert>{error}</InlineAlert>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
          <Button
            type="button"
            disabled={isSaving || !record}
            onClick={onConfirm}
            variant="danger"
          >
            {isSaving
              ? t("masterData.common.deactivate.deactivating")
              : t(`masterData.${kind}.actions.deactivate`)}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
