import AsyncContent from "@/components/common/AsyncContent";
import DataSourceBadge from "@/components/common/DataSourceBadge";
import InlineAlert from "@/components/common/InlineAlert";
import ListPagination from "@/components/common/ListPagination";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/button/Button";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useModal } from "@/hooks/useModal";
import { usePagedItems } from "@/hooks/usePagination";
import { PlusIcon } from "@/icons";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import DeactivateMasterDataModal from "./DeactivateMasterDataModal";
import MasterDataFormModal from "./MasterDataFormModal";
import {
  createDemoMasterDataRecord,
  createMasterData,
  deactivateMasterData,
  fetchMasterData,
  updateMasterData,
} from "./masterDataRepository";
import MasterDataTable from "./MasterDataTable";
import MasterDataToolbar from "./MasterDataToolbar";
import type {
  MasterDataFormValues,
  MasterDataKind,
  MasterDataPayload,
  MasterDataRecord,
  MasterDataStatus,
} from "./types";

type MasterDataPageProps = {
  kind: MasterDataKind;
};

const emptyPayload: MasterDataPayload = { source: "demo", records: [] };

export default function MasterDataPage({ kind }: MasterDataPageProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MasterDataStatus>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formVersion, setFormVersion] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<MasterDataRecord | null>(
    null,
  );

  const formModal = useModal();
  const deactivateModal = useModal();

  const loadRecords = useCallback(() => fetchMasterData(kind), [kind]);
  const {
    data: { records, source },
    isLoading,
    error: loadError,
    cachedAt,
    reload,
    setData,
  } = useAsyncData(loadRecords, {
    initialData: emptyPayload,
    errorMessage: t(`masterData.${kind}.errors.load`),
    offlineKey: `master-data:${kind}`,
  });
  const setRecords = (
    update: (current: MasterDataRecord[]) => MasterDataRecord[],
  ) => setData((current) => ({ ...current, records: update(current.records) }));

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !normalizedSearch ||
        record.name.toLowerCase().includes(normalizedSearch) ||
        record.code.toLowerCase().includes(normalizedSearch) ||
        record.phone.toLowerCase().includes(normalizedSearch) ||
        record.email.toLowerCase().includes(normalizedSearch) ||
        record.contactName.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        status === "all" ||
        (status === "active" && record.isActive) ||
        (status === "inactive" && !record.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [records, search, status]);
  const paging = usePagedItems(filteredRecords, `${kind}|${search}|${status}`);

  const openCreateModal = () => {
    setSelectedRecord(null);
    setError("");
    setFormVersion((current) => current + 1);
    formModal.openModal();
  };

  const openEditModal = (record: MasterDataRecord) => {
    setSelectedRecord(record);
    setError("");
    setFormVersion((current) => current + 1);
    formModal.openModal();
  };

  const openDeactivateModal = (record: MasterDataRecord) => {
    if (record.isProtected) {
      setError(t(`masterData.${kind}.errors.protectedRecord`));
      return;
    }

    setSelectedRecord(record);
    setError("");
    deactivateModal.openModal();
  };

  const hasDuplicateCode = (values: MasterDataFormValues) => {
    const normalizedCode = values.code.trim().toUpperCase();
    return records.some(
      (record) =>
        record.code.trim().toUpperCase() === normalizedCode &&
        record.id !== selectedRecord?.id,
    );
  };

  const handleSubmit = async (values: MasterDataFormValues) => {
    setError("");

    if (hasDuplicateCode(values)) {
      setError(t(`masterData.${kind}.errors.duplicateCode`));
      return;
    }

    if (selectedRecord?.isProtected && !values.isActive) {
      setError(t(`masterData.${kind}.errors.protectedRecord`));
      return;
    }

    setIsSaving(true);

    try {
      const savedRecord =
        source === "supabase"
          ? selectedRecord
            ? await updateMasterData(kind, selectedRecord.id, values)
            : await createMasterData(kind, values)
          : createDemoMasterDataRecord(
              kind,
              values,
              selectedRecord || undefined,
            );

      setRecords((current) =>
        selectedRecord
          ? current.map((record) =>
              record.id === savedRecord.id ? savedRecord : record,
            )
          : [savedRecord, ...current],
      );
      formModal.closeModal();
      setSelectedRecord(null);
    } catch (saveError) {
      setError(getErrorMessage(saveError, t(`masterData.${kind}.errors.save`)));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedRecord) return;

    setError("");
    setIsSaving(true);

    try {
      const savedRecord =
        source === "supabase"
          ? await deactivateMasterData(kind, selectedRecord.id)
          : {
              ...selectedRecord,
              isActive: false,
              updatedAt: new Date().toISOString(),
            };

      setRecords((current) =>
        current.map((record) =>
          record.id === savedRecord.id ? savedRecord : record,
        ),
      );
      deactivateModal.closeModal();
      setSelectedRecord(null);
    } catch (deactivateError) {
      setError(
        getErrorMessage(
          deactivateError,
          t(`masterData.${kind}.errors.deactivate`),
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(`masterData.${kind}.title`)}
        description={t(`masterData.${kind}.description`)}
        meta={!isLoading && <DataSourceBadge source={source} cachedAt={cachedAt} />}
        actions={
          <Button
            startIcon={<PlusIcon className="size-5" />}
            onClick={openCreateModal}
          >
            {t(`masterData.${kind}.actions.add`)}
          </Button>
        }
      />

      <section
        aria-label={t(`masterData.${kind}.listTitle`)}
        className="space-y-4"
      >
        <MasterDataToolbar
          kind={kind}
          search={search}
          status={status}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
        />

        {error && !formModal.isOpen && !deactivateModal.isOpen && (
          <InlineAlert>{error}</InlineAlert>
        )}

        <AsyncContent
          isLoading={isLoading}
          error={loadError}
          onRetry={reload}
          loadingLabel={t(`masterData.${kind}.loading`)}
        >
          <MasterDataTable
            kind={kind}
            records={paging.pageItems}
            onEdit={openEditModal}
            onDeactivate={openDeactivateModal}
          />
          <ListPagination {...paging.pagination} />
        </AsyncContent>
      </section>

      <MasterDataFormModal
        key={`${kind}-form-${formVersion}`}
        kind={kind}
        isOpen={formModal.isOpen}
        record={selectedRecord}
        isSaving={isSaving}
        error={formModal.isOpen ? error : ""}
        onClose={formModal.closeModal}
        onSubmit={handleSubmit}
      />

      <DeactivateMasterDataModal
        kind={kind}
        isOpen={deactivateModal.isOpen}
        record={selectedRecord}
        isSaving={isSaving}
        error={deactivateModal.isOpen ? error : ""}
        onClose={deactivateModal.closeModal}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
