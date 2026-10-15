import ComponentCard from "@/components/common/ComponentCard";
import ListPagination from "@/components/common/ListPagination";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useModal } from "@/hooks/useModal";
import { useEffect, useMemo, useState } from "react";
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
  MasterDataRecord,
  MasterDataSource,
  MasterDataStatus,
} from "./types";

type MasterDataPageProps = {
  kind: MasterDataKind;
};

const PAGE_SIZE = 20;

export default function MasterDataPage({ kind }: MasterDataPageProps) {
  const { t } = useTranslation();
  const [records, setRecords] = useState<MasterDataRecord[]>([]);
  const [source, setSource] = useState<MasterDataSource>("demo");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MasterDataStatus>("all");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formVersion, setFormVersion] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<MasterDataRecord | null>(
    null,
  );

  const formModal = useModal();
  const deactivateModal = useModal();

  useEffect(() => {
    let isMounted = true;

    const loadRecords = async () => {
      setIsLoading(true);
      setError("");

      try {
        const payload = await fetchMasterData(kind);
        if (!isMounted) return;
        setRecords(payload.records);
        setSource(payload.source);
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : t(`masterData.${kind}.errors.load`),
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadRecords();

    return () => {
      isMounted = false;
    };
  }, [kind, t]);

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
  const visibleRecords = filteredRecords.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => setPage(1), [kind, search, status]);

  const stats = useMemo(
    () => ({
      total: records.length,
      active: records.filter((record) => record.isActive).length,
      inactive: records.filter((record) => !record.isActive).length,
    }),
    [records],
  );

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
      setError(
        saveError instanceof Error
          ? saveError.message
          : t(`masterData.${kind}.errors.save`),
      );
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
        deactivateError instanceof Error
          ? deactivateError.message
          : t(`masterData.${kind}.errors.deactivate`),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle={t(`masterData.${kind}.title`)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("masterData.common.stats.total")}
          </p>
          <p className="mt-2 text-title-sm font-semibold text-gray-800 dark:text-white/90">
            {stats.total}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("masterData.common.stats.active")}
          </p>
          <p className="mt-2 text-title-sm font-semibold text-gray-800 dark:text-white/90">
            {stats.active}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("masterData.common.stats.inactive")}
          </p>
          <p className="mt-2 text-title-sm font-semibold text-gray-800 dark:text-white/90">
            {stats.inactive}
          </p>
        </div>
      </div>

      <ComponentCard title={t(`masterData.${kind}.listTitle`)}>
        <div className="space-y-5">
          <MasterDataToolbar
            kind={kind}
            search={search}
            status={status}
            source={source}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onCreate={openCreateModal}
          />

          {error && !formModal.isOpen && !deactivateModal.isOpen && (
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-xl border border-gray-200 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
              {t(`masterData.${kind}.loading`)}
            </div>
          ) : (
            <MasterDataTable
              kind={kind}
              records={visibleRecords}
              onEdit={openEditModal}
              onDeactivate={openDeactivateModal}
            />
          )}
          {!isLoading && (
            <ListPagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={filteredRecords.length}
              onPageChange={setPage}
            />
          )}
        </div>
      </ComponentCard>

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
