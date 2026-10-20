import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useTranslation } from "react-i18next";
import type { Material } from "./types";

type DeleteMaterialModalProps = {
  isOpen: boolean;
  material: Material | null;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteMaterialModal({
  isOpen,
  material,
  isSaving,
  error,
  onClose,
  onConfirm,
}: DeleteMaterialModalProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      isOpen={isOpen}
      tone="danger"
      title={t("materials.delete.title")}
      description={t("materials.delete.description", {
        name: material?.name || "",
      })}
      confirmLabel={t("materials.actions.deactivate")}
      busyLabel={t("materials.delete.deactivating")}
      isBusy={isSaving}
      confirmDisabled={!material}
      error={error}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
