import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import { HamburgerIcon, XMarkIcon } from "@/icons";
import { useTranslation } from "react-i18next";
import BrandMark from "./BrandMark";

const AppHeader: React.FC = () => {
  const { t } = useTranslation();
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1280) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-999 flex h-16 w-full items-center gap-3 border-b border-line bg-white px-4 md:px-6 dark:bg-gray-900">
      <button
        type="button"
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-none"
        onClick={handleToggle}
        aria-label={t("header.toggleSidebar")}
        aria-expanded={isMobileOpen || undefined}
      >
        {isMobileOpen ? (
          <XMarkIcon />
        ) : (
          <HamburgerIcon className="rtl:-scale-x-100" />
        )}
      </button>

      <div className="min-w-0 xl:hidden">
        <BrandMark />
      </div>

      <div className="ms-auto flex items-center gap-2 sm:gap-3">
        <ThemeToggleButton />
        <UserDropdown />
      </div>
    </header>
  );
};

export default AppHeader;
