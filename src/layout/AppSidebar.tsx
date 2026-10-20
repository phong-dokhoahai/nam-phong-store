import { useAuth } from "@/auth";
import { useSidebar } from "@/context/SidebarContext";
import type { ComponentType, SVGProps } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import {
  BoltIcon,
  BoxCubeIcon,
  ChartAltIcon,
  DashboardAltIcon,
  DollarLineIcon,
  FolderIcon,
  GroupIcon,
  InboxAltIcon,
  ListIcon,
  PageIcon,
  PieChartIcon,
  TableIcon,
  UserIcon,
} from "../icons";
import { cn } from "../utils";
import BrandMark from "./BrandMark";

type NavItem = {
  /** Key under `sidebar.items`. */
  key: string;
  path: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
};

type NavGroup = {
  /** Key under `sidebar.groups`. */
  key: string;
  items: NavItem[];
};

// Grouped by the user's task: day-to-day stock work, reference data, reports.
const navGroups: NavGroup[] = [
  {
    key: "operations",
    items: [
      { key: "inventoryOverview", path: "/inventory", icon: DashboardAltIcon },
      { key: "stockReceipts", path: "/stock-receipts", icon: InboxAltIcon },
      { key: "stockIssues", path: "/stock-issues", icon: PageIcon },
      { key: "payments", path: "/payments", icon: DollarLineIcon },
    ],
  },
  {
    key: "catalog",
    items: [
      { key: "materials", path: "/materials", icon: BoxCubeIcon },
      { key: "categories", path: "/categories", icon: FolderIcon },
      { key: "units", path: "/units", icon: ListIcon },
      { key: "suppliers", path: "/suppliers", icon: GroupIcon },
      { key: "customers", path: "/customers", icon: UserIcon },
    ],
  },
  {
    key: "reports",
    items: [
      {
        key: "reportsInventory",
        path: "/reports/inventory",
        icon: PieChartIcon,
      },
      { key: "reportsPurchase", path: "/reports/purchases", icon: TableIcon },
      { key: "reportsSales", path: "/reports/sales", icon: TableIcon },
      { key: "reportsLowStock", path: "/reports/low-stock", icon: BoltIcon },
      {
        key: "reportsRevenue",
        path: "/reports/revenue",
        icon: ChartAltIcon,
        adminOnly: true,
      },
      {
        key: "reportsCustomerDebt",
        path: "/reports/customer-debt",
        icon: DollarLineIcon,
        adminOnly: true,
      },
      {
        key: "reportsSupplierDebt",
        path: "/reports/supplier-debt",
        icon: DollarLineIcon,
        adminOnly: true,
      },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { profile } = useAuth();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } =
    useSidebar();
  const { t } = useTranslation();
  const location = useLocation();
  const showLabels = isExpanded || isHovered || isMobileOpen;

  // Auto-close the mobile drawer after navigating.
  useEffect(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const canSee = (item: NavItem) =>
    !item.adminOnly || profile?.role === "ADMIN";

  return (
    <aside
      className={cn(
        "fixed inset-s-0 top-0 z-50 flex h-screen flex-col border-e border-line bg-white transition-all duration-300 ease-in-out xl:translate-x-0 xl:rtl:translate-x-0 dark:bg-gray-900",
        showLabels ? "w-64" : "w-20",
        isMobileOpen
          ? "translate-x-0"
          : "-translate-x-full rtl:translate-x-full",
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-line px-5",
          !showLabels && "xl:justify-center xl:px-0",
        )}
      >
        <BrandMark compact={!showLabels} />
      </div>

      <nav
        aria-label={t("sidebar.navLabel")}
        className="no-scrollbar flex-1 overflow-y-auto px-3 py-4"
      >
        {navGroups.map((group) => {
          const items = group.items.filter(canSee);
          if (items.length === 0) return null;

          return (
            <div key={group.key} className="mb-5 last:mb-0">
              <h2
                className={cn(
                  "mb-1.5 px-3 text-xs font-medium text-fg-subtle",
                  !showLabels && "xl:sr-only",
                )}
              >
                {t(`sidebar.groups.${group.key}`)}
              </h2>
              <ul className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  const label = t(`sidebar.items.${item.key}`);

                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        aria-current={isActive ? "page" : undefined}
                        title={showLabels ? undefined : label}
                        className={cn(
                          "group menu-item",
                          isActive ? "menu-item-active" : "menu-item-inactive",
                          !showLabels && "xl:justify-center",
                        )}
                      >
                        <Icon
                          aria-hidden="true"
                          className={cn(
                            "size-5 shrink-0",
                            isActive
                              ? "menu-item-icon-active"
                              : "menu-item-icon-inactive",
                          )}
                        />
                        <span
                          className={cn(
                            "truncate",
                            !showLabels && "xl:sr-only",
                          )}
                        >
                          {label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default AppSidebar;
