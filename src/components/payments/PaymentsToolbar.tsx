import FilterToolbar from "@/components/common/FilterToolbar";
import SearchInput from "@/components/common/SearchInput";
import Select from "@/components/form/Select";
import { useTranslation } from "react-i18next";
import type { PaymentDirection } from "./types";

type PaymentsToolbarProps = {
  search: string;
  direction: "all" | PaymentDirection;
  onSearchChange: (value: string) => void;
  onDirectionChange: (value: "all" | PaymentDirection) => void;
};

export default function PaymentsToolbar({
  search,
  direction,
  onSearchChange,
  onDirectionChange,
}: PaymentsToolbarProps) {
  const { t } = useTranslation();

  return (
    <FilterToolbar
      search={
        <SearchInput
          aria-label={t("payments.toolbar.searchLabel")}
          value={search}
          onChange={onSearchChange}
          placeholder={t("payments.toolbar.searchPlaceholder")}
        />
      }
    >
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
    </FilterToolbar>
  );
}
