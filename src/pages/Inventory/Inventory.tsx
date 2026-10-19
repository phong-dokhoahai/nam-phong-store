import ComponentCard from "@/components/common/ComponentCard";
import ListPagination from "@/components/common/ListPagination";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import InventoryStats from "@/components/inventory/InventoryStats";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryToolbar from "@/components/inventory/InventoryToolbar";
import { fetchMaterialsPayload } from "@/components/materials/materialsRepository";
import { getMaterialStatus } from "@/components/materials/materialStatus";
import type {
  Material,
  MaterialFilterStatus,
  MaterialLookup,
  MaterialSource,
} from "@/components/materials/types";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import LoadingState from "@/components/common/LoadingState";
import InlineAlert from "@/components/common/InlineAlert";

const PAGE_SIZE = 20;

export default function Inventory() {
  const { t } = useTranslation();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<MaterialLookup[]>([]);
  const [source, setSource] = useState<MaterialSource>("demo");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<MaterialFilterStatus>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const loadInventory = async () => {
      setIsLoading(true);
      setError("");

      try {
        const payload = await fetchMaterialsPayload();
        if (!isMounted) return;
        setMaterials(payload.materials);
        setCategories(payload.categories);
        setSource(payload.source);
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("inventory.errors.load"),
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInventory();

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
  const visibleMaterials = filteredMaterials.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => setPage(1), [categoryId, search, status]);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle={t("inventory.title")} />

      <InventoryStats materials={materials} />

      <ComponentCard title={t("inventory.listTitle")}>
        <div className="space-y-5">
          <InventoryToolbar
            search={search}
            categoryId={categoryId}
            status={status}
            categories={categories}
            source={source}
            onSearchChange={setSearch}
            onCategoryChange={setCategoryId}
            onStatusChange={setStatus}
          />

          {error && <InlineAlert>{error}</InlineAlert>}

          {isLoading ? (
            <LoadingState label={t("inventory.loading")} />
          ) : (
            <InventoryTable materials={visibleMaterials} />
          )}
          {!isLoading && (
            <ListPagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={filteredMaterials.length}
              onPageChange={setPage}
            />
          )}
        </div>
      </ComponentCard>
    </div>
  );
}
