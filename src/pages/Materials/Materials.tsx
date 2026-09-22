import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DeleteMaterialModal from "@/components/materials/DeleteMaterialModal";
import MaterialFormModal from "@/components/materials/MaterialFormModal";
import {
  createMaterial,
  deactivateMaterial,
  fetchMaterialsPayload,
  updateMaterial,
} from "@/components/materials/materialsRepository";
import { getMaterialStatus } from "@/components/materials/materialStatus";
import MaterialsStats from "@/components/materials/MaterialsStats";
import MaterialsTable from "@/components/materials/MaterialsTable";
import MaterialsToolbar from "@/components/materials/MaterialsToolbar";
import type {
  Material,
  MaterialFilterStatus,
  MaterialFormValues,
  MaterialLookup,
  MaterialSource,
} from "@/components/materials/types";
import { useModal } from "@/hooks/useModal";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const newDemoId = () =>
  `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export default function Materials() {
  const { t } = useTranslation();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<MaterialLookup[]>([]);
  const [units, setUnits] = useState<MaterialLookup[]>([]);
  const [source, setSource] = useState<MaterialSource>("demo");
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    let isMounted = true;

    const loadMaterials = async () => {
      setIsLoading(true);
      setError("");

      try {
        const payload = await fetchMaterialsPayload();
        if (!isMounted) return;
        setMaterials(payload.materials);
        setCategories(payload.categories);
        setUnits(payload.units);
        setSource(payload.source);
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("materials.errors.load"),
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadMaterials();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const filteredMaterials = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return materials.filter((material) => {
      const matchesSearch =
        !normalizedSearch ||
        material.name.toLowerCase().includes(normalizedSearch) ||
        material.sku.toLowerCase().includes(normalizedSearch);
      const matchesCategory =
        categoryId === "all" || material.categoryId === categoryId;
      const matchesStatus =
        status === "all" || getMaterialStatus(material) === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryId, materials, search, status]);

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
      if (source === "supabase") {
        const savedMaterial = selectedMaterial
          ? await updateMaterial(selectedMaterial.id, values)
          : await createMaterial(values);

        setMaterials((current) =>
          selectedMaterial
            ? current.map((material) =>
                material.id === savedMaterial.id ? savedMaterial : material,
              )
            : [savedMaterial, ...current],
        );
      } else {
        const savedMaterial = materialFromDemoValues(
          values,
          selectedMaterial || undefined,
        );
        setMaterials((current) =>
          selectedMaterial
            ? current.map((material) =>
                material.id === savedMaterial.id ? savedMaterial : material,
              )
            : [savedMaterial, ...current],
        );
      }

      formModal.closeModal();
      setSelectedMaterial(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t("materials.errors.save"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedMaterial) return;

    setError("");
    setIsSaving(true);

    try {
      if (source === "supabase") {
        const savedMaterial = await deactivateMaterial(selectedMaterial.id);
        setMaterials((current) =>
          current.map((material) =>
            material.id === savedMaterial.id ? savedMaterial : material,
          ),
        );
      } else {
        setMaterials((current) =>
          current.map((material) =>
            material.id === selectedMaterial.id
              ? {
                  ...material,
                  isActive: false,
                  updatedAt: new Date().toISOString(),
                }
              : material,
          ),
        );
      }

      deleteModal.closeModal();
      setSelectedMaterial(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : t("materials.errors.deactivate"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle={t("materials.title")} />

      <MaterialsStats materials={materials} />

      <ComponentCard title={t("materials.listTitle")}>
        <div className="space-y-5">
          <MaterialsToolbar
            search={search}
            categoryId={categoryId}
            status={status}
            categories={categories}
            source={source}
            onSearchChange={setSearch}
            onCategoryChange={setCategoryId}
            onStatusChange={setStatus}
            onCreate={openCreateModal}
          />

          {error && !formModal.isOpen && !deleteModal.isOpen && (
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-xl border border-gray-200 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
              {t("materials.loading")}
            </div>
          ) : (
            <MaterialsTable
              materials={filteredMaterials}
              onEdit={openEditModal}
              onDeactivate={openDeleteModal}
            />
          )}
        </div>
      </ComponentCard>

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
