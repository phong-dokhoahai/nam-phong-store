import AsyncContent from "@/components/common/AsyncContent";
import DataSourceBadge from "@/components/common/DataSourceBadge";
import InlineAlert from "@/components/common/InlineAlert";
import ListPagination from "@/components/common/ListPagination";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";
import DeleteMaterialModal from "@/components/materials/DeleteMaterialModal";
import { filterMaterials } from "@/components/materials/materialFilters";
import MaterialFormModal from "@/components/materials/MaterialFormModal";
import {
  createMaterial,
  deactivateMaterial,
  fetchMaterialsPayload,
  type MaterialsPayload,
  updateMaterial,
} from "@/components/materials/materialsRepository";
import MaterialsStats from "@/components/materials/MaterialsStats";
import MaterialsTable from "@/components/materials/MaterialsTable";
import MaterialsToolbar from "@/components/materials/MaterialsToolbar";
import type {
  Material,
  MaterialFilterStatus,
  MaterialFormValues,
} from "@/components/materials/types";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useModal } from "@/hooks/useModal";
import { usePagedItems } from "@/hooks/usePagination";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const newDemoId = () =>
  `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const emptyPayload: MaterialsPayload = {
  source: "demo",
  materials: [],
  categories: [],
  units: [],
};

export default function Materials() {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<MaterialFilterStatus>("all");
  const [formVersion, setFormVersion] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null,
  );

  const formModal = useModal();
  const deleteModal = useModal();

  const {
    data,
    isLoading,
    error: loadError,
    reload,
    setData,
  } = useAsyncData(fetchMaterialsPayload, {
    initialData: emptyPayload,
    errorMessage: t("materials.errors.load"),
  });
  const { materials, categories, units, source } = data;
  const setMaterials = (update: (current: Material[]) => Material[]) =>
    setData((current) => ({
      ...current,
      materials: update(current.materials),
    }));

  const filteredMaterials = useMemo(
    () => filterMaterials(materials, { search, categoryId, status }),
    [categoryId, materials, search, status],
  );
  const paging = usePagedItems(
    filteredMaterials,
    `${search}|${categoryId}|${status}`,
  );

  const openCreateModal = () => {
    setSelectedMaterial(null);
    setError("");
    setFormVersion((current) => current + 1);
    formModal.openModal();
  };

  const openEditModal = (material: Material) => {
    setSelectedMaterial(material);
    setError("");
    setFormVersion((current) => current + 1);
    formModal.openModal();
  };

  const openDeleteModal = (material: Material) => {
    setSelectedMaterial(material);
    setError("");
    deleteModal.openModal();
  };

  const hasDuplicateSku = (values: MaterialFormValues) => {
    const normalizedSku = values.sku.trim().toUpperCase();
    return materials.some(
      (material) =>
        material.sku.trim().toUpperCase() === normalizedSku &&
        material.id !== selectedMaterial?.id,
    );
  };

  const materialFromDemoValues = (
    values: MaterialFormValues,
    existing?: Material,
  ): Material => {
    const category = categories.find((item) => item.id === values.categoryId);
    const unit = units.find((item) => item.id === values.unitId);

    return {
      id: existing?.id || newDemoId(),
      sku: values.sku.trim().toUpperCase(),
      name: values.name.trim(),
      categoryId: values.categoryId,
      categoryName: category?.name || "",
      unitId: values.unitId,
      unitName: unit?.name || "",
      description: values.description.trim(),
      defaultPurchasePrice: values.defaultPurchasePrice,
      defaultSalePrice: values.defaultSalePrice,
      minimumStock: values.minimumStock,
      currentStock: existing?.currentStock || 0,
      isActive: values.isActive,
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSubmit = async (values: MaterialFormValues) => {
    setError("");

    if (hasDuplicateSku(values)) {
      setError(t("materials.errors.duplicateSku"));
      return;
    }

    setIsSaving(true);

    try {
      const savedMaterial =
        source === "supabase"
          ? selectedMaterial
            ? await updateMaterial(selectedMaterial.id, values)
            : await createMaterial(values)
          : materialFromDemoValues(values, selectedMaterial || undefined);

      setMaterials((current) =>
        selectedMaterial
          ? current.map((material) =>
              material.id === savedMaterial.id ? savedMaterial : material,
            )
          : [savedMaterial, ...current],
      );

      formModal.closeModal();
      setSelectedMaterial(null);
    } catch (saveError) {
      setError(getErrorMessage(saveError, t("materials.errors.save")));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedMaterial) return;

    setError("");
    setIsSaving(true);

    try {
      const savedMaterial =
        source === "supabase"
          ? await deactivateMaterial(selectedMaterial.id)
          : {
              ...selectedMaterial,
              isActive: false,
              updatedAt: new Date().toISOString(),
            };

      setMaterials((current) =>
        current.map((material) =>
          material.id === savedMaterial.id ? savedMaterial : material,
        ),
      );

      deleteModal.closeModal();
      setSelectedMaterial(null);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, t("materials.errors.deactivate")));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("materials.title")}
        description={t("materials.description")}
        meta={!isLoading && <DataSourceBadge source={source} />}
        actions={
          <Button
            startIcon={<PlusIcon className="size-5" />}
            onClick={openCreateModal}
          >
            {t("materials.actions.add")}
          </Button>
        }
      />

      <MaterialsStats
        materials={materials}
        status={status}
        onStatusChange={setStatus}
      />

      <section aria-label={t("materials.listTitle")} className="space-y-4">
        <MaterialsToolbar
          search={search}
          categoryId={categoryId}
          status={status}
          categories={categories}
          onSearchChange={setSearch}
          onCategoryChange={setCategoryId}
          onStatusChange={setStatus}
        />

        {error && !formModal.isOpen && !deleteModal.isOpen && (
          <InlineAlert>{error}</InlineAlert>
        )}

        <AsyncContent
          isLoading={isLoading}
          error={loadError}
          onRetry={reload}
          loadingLabel={t("materials.loading")}
        >
          <MaterialsTable
            materials={paging.pageItems}
            onEdit={openEditModal}
            onDeactivate={openDeleteModal}
          />
          <ListPagination {...paging.pagination} />
        </AsyncContent>
      </section>

      <MaterialFormModal
        key={`material-form-${formVersion}`}
        isOpen={formModal.isOpen}
        material={selectedMaterial}
        categories={categories}
        units={units}
        isSaving={isSaving}
        error={formModal.isOpen ? error : ""}
        onClose={formModal.closeModal}
        onSubmit={handleSubmit}
      />

      <DeleteMaterialModal
        isOpen={deleteModal.isOpen}
        material={selectedMaterial}
        isSaving={isSaving}
        error={deleteModal.isOpen ? error : ""}
        onClose={deleteModal.closeModal}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
