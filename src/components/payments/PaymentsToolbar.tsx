import SearchInput from "@/components/common/SearchInput";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";
import { useTranslation } from "react-i18next";
import type { PaymentDirection, PaymentSource } from "./types";

type PaymentsToolbarProps = {
  search: string;
  direction: "all" | PaymentDirection;
  source: PaymentSource;
  onSearchChange: (value: string) => void;
  onDirectionChange: (value: "all" | PaymentDirection) => void;
  onCreate: () => void;
};

export default function PaymentsToolbar({
  search,
  direction,
  source,
  onSearchChange,
  onDirectionChange,
  onCreate,
}: PaymentsToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="w-full sm:max-w-80">
          <SearchInput
            aria-label={t("payments.toolbar.searchLabel")}
            value={search}
            onChange={onSearchChange}
            placeholder={t("payments.toolbar.searchPlaceholder")}
          />
        </div>
        <div className="sm:w-56">
          <Select
            aria-label={t("payments.toolbar.directionLabel")}
            value={direction}
            onChange={(value) =>
              onDirectionChange(value as "all" | PaymentDirection)
            }
            options={[
              { value: "all", label: t("payments.toolbar.allDirections") },
              { value: "customer", label: t("payments.direction.customer") },
              { value: "supplier", label: t("payments.direction.supplier") },
            ]}
          />
        </div>
        <span className="inline-flex h-11 items-center rounded-lg border border-gray-200 px-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          {t(
            source === "supabase"
              ? "payments.toolbar.liveSource"
              : "payments.toolbar.demoSource",
          )}
        </span>
      </div>

      <Button startIcon={<PlusIcon className="size-5" />} onClick={onCreate}>
        {t("payments.actions.record")}
      </Button>
    </div>
  );
}
