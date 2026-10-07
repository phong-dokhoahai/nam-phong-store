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
        <input
          aria-label={t("payments.toolbar.searchLabel")}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("payments.toolbar.searchPlaceholder")}
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden sm:max-w-80 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        />
        <select
          aria-label={t("payments.toolbar.directionLabel")}
          value={direction}
          onChange={(event) =>
            onDirectionChange(event.target.value as "all" | PaymentDirection)
          }
          className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pe-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
        >
          <option value="all">{t("payments.toolbar.allDirections")}</option>
          <option value="customer">{t("payments.direction.customer")}</option>
          <option value="supplier">{t("payments.direction.supplier")}</option>
        </select>
        <span className="inline-flex h-11 items-center rounded-lg border border-gray-200 px-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          {t(
            source === "supabase"
              ? "payments.toolbar.liveSource"
              : "payments.toolbar.demoSource",
          )}
        </span>
      </div>

      <button
        type="button"
        onClick={onCreate}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white shadow-theme-xs transition-colors hover:bg-brand-600"
      >
        <PlusIcon className="size-4" />
        {t("payments.actions.record")}
      </button>
    </div>
  );
}
