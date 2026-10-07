import { Modal } from "@/components/ui/modal";
import StockReceiptEditor from "./StockReceiptEditor";
import type {
  StockReceipt,
  StockReceiptDraftValues,
  StockReceiptMaterialLookup,
  StockReceiptSupplierLookup,
} from "./types";

type StockReceiptFormModalProps = {
  isOpen: boolean;
  draft: StockReceiptDraftValues;
  selectedReceipt: StockReceipt | null;
  suppliers: StockReceiptSupplierLookup[];
  materials: StockReceiptMaterialLookup[];
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onDraftChange: (draft: StockReceiptDraftValues) => void;
  onSave: () => void;
  onConfirm: () => void;
};

export default function StockReceiptFormModal({
  isOpen,
  draft,
  selectedReceipt,
  suppliers,
  materials,
  isSaving,
  error,
  onClose,
  onDraftChange,
  onSave,
  onConfirm,
}: StockReceiptFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-7xl p-4 sm:p-6">
      <StockReceiptEditor
        draft={draft}
        selectedReceipt={selectedReceipt}
        suppliers={suppliers}
        materials={materials}
        isSaving={isSaving}
        error={error}
        onDraftChange={onDraftChange}
        onSave={onSave}
        onConfirm={onConfirm}
      />
    </Modal>
  );
}
