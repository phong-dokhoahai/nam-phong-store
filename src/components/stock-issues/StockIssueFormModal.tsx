import { Modal } from "@/components/ui/modal";
import StockIssueEditor from "./StockIssueEditor";
import type {
  StockIssue,
  StockIssueCustomerLookup,
  StockIssueDraftValues,
  StockIssueMaterialLookup,
} from "./types";

type StockIssueFormModalProps = {
  isOpen: boolean;
  draft: StockIssueDraftValues;
  selectedIssue: StockIssue | null;
  customers: StockIssueCustomerLookup[];
  materials: StockIssueMaterialLookup[];
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onDraftChange: (draft: StockIssueDraftValues) => void;
  onSave: () => void;
  onConfirm: () => void;
};

export default function StockIssueFormModal({
  isOpen,
  draft,
  selectedIssue,
  customers,
  materials,
  isSaving,
  error,
  onClose,
  onDraftChange,
  onSave,
  onConfirm,
}: StockIssueFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-7xl p-4 sm:p-6">
      <StockIssueEditor
        draft={draft}
        selectedIssue={selectedIssue}
        customers={customers}
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
