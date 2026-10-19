import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { PlusIcon, SearchIcon } from "@/icons";
import { useTranslation } from "react-i18next";
import type {
  MasterDataKind,
  MasterDataSource,
  MasterDataStatus,
} from "./types";

type MasterDataToolbarProps = {
  kind: MasterDataKind;
  search: string;
  status: MasterDataStatus;
  source: MasterDataSource;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: MasterDataStatus) => void;
  onCreate: () => void;
};

export default function MasterDataToolbar({
  kind,
  search,
  status,
  source,
  onSearchChange,
  onStatusChange,
  onCreate,
}: MasterDataToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
        <div className="relative">
          <SearchIcon className="absolute inset-s-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t(`masterData.${kind}.toolbar.searchPlaceholder`)}
            className="ps-10"
          />
        </div>
        <Select
          value={status}
          placeholder={t("masterData.common.toolbar.allStatuses")}
          options={[
            {
              value: "all",
              label: t("masterData.common.toolbar.allStatuses"),
            },
            { value: "active", label: t("masterData.common.status.active") },
            {
              value: "inactive",
              label: t("masterData.common.status.inactive"),
            },
          ]}
          onChange={(value) => onStatusChange(value as MasterDataStatus)}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {source === "supabase"
            ? t("masterData.common.toolbar.liveSource")
            : t("masterData.common.toolbar.demoSource")}
        </span>
        <Button startIcon={<PlusIcon className="size-5" />} onClick={onCreate}>
          {t(`masterData.${kind}.actions.add`)}
        </Button>
      </div>
    </div>
  );
}
