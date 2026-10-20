import InlineAlert from "@/components/common/InlineAlert";
import Button from "@/components/ui/button/Button";
import { Modal, ModalFooter, ModalHeader } from "@/components/ui/modal";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  /** Label of the confirm button, e.g. "Deactivate". */
  confirmLabel: string;
  /** Label shown while `isBusy`, e.g. "Deactivating…". */
  busyLabel: string;
  /** "danger" for destructive actions (deactivate, cancel a document). */
  tone?: "primary" | "danger";
  isBusy: boolean;
  /** Extra condition that blocks confirming (e.g. nothing selected). */
  confirmDisabled?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

/** Yes/no dialog for an action that changes important data. */
export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  busyLabel,
  tone = "primary",
  isBusy,
  confirmDisabled = false,
  error,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="space-y-5">
        <ModalHeader title={title} description={description} />

        {error && <InlineAlert>{error}</InlineAlert>}

        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={isBusy}>
            {t("common.close")}
          </Button>
          <Button
            variant={tone}
            loading={isBusy}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {isBusy ? busyLabel : confirmLabel}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
