import AsyncContent from "@/components/common/AsyncContent";
import DataSourceBadge from "@/components/common/DataSourceBadge";
import ListPagination from "@/components/common/ListPagination";
import PageHeader from "@/components/common/PageHeader";
import InventoryStats from "@/components/inventory/InventoryStats";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryToolbar from "@/components/inventory/InventoryToolbar";
import { filterMaterials } from "@/components/materials/materialFilters";
import {
  fetchMaterialsPayload,
  type MaterialsPayload,
} from "@/components/materials/materialsRepository";
import type { MaterialFilterStatus } from "@/components/materials/types";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePagedItems } from "@/hooks/usePagination";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const emptyPayload: MaterialsPayload = {
  source: "demo",
  materials: [],
  categories: [],
  units: [],
};

export default function Inventory() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<MaterialFilterStatus>("all");
  const { data, isLoading, error, reload } = useAsyncData(
    fetchMaterialsPayload,
    { initialData: emptyPayload, errorMessage: t("inventory.errors.load") },
  );

  const filteredMaterials = useMemo(
    () => filterMaterials(data.materials, { search, categoryId, status }),
    [categoryId, data.materials, search, status],
  );
  const paging = usePagedItems(
    filteredMaterials,
    `${search}|${categoryId}|${status}`,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("inventory.title")}
        description={t("inventory.description")}
        meta={!isLoading && <DataSourceBadge source={data.source} />}
      />

      <InventoryStats
        materials={data.materials}
        status={status}
        onStatusChange={setStatus}
      />

      <section aria-label={t("inventory.listTitle")} className="space-y-4">
        <InventoryToolbar
          search={search}
          categoryId={categoryId}
          status={status}
          categories={data.categories}
          onSearchChange={setSearch}
          onCategoryChange={setCategoryId}
          onStatusChange={setStatus}
        />

        <AsyncContent
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          loadingLabel={t("inventory.loading")}
        >
          <InventoryTable materials={paging.pageItems} />
          <ListPagination {...paging.pagination} />
        </AsyncContent>
      </section>
    </div>
  );
}
