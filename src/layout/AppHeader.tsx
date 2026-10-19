"use client";

import { AppMenuDotsIcon, HamburgerIcon, SearchIcon, XMarkIcon } from "@/icons";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/utils";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

const AppHeader: React.FC = () => {
  const { t } = useTranslation("header");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1280) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-99999 flex w-full border-gray-200 bg-white xl:border-b dark:border-gray-800 dark:bg-gray-900">
      <div className="flex grow flex-col items-center justify-between xl:flex-row xl:px-6">
        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 sm:gap-4 xl:justify-normal xl:border-b-0 xl:px-0 xl:py-4 dark:border-gray-800">
          <button
            className={`z-99999 flex h-10 w-10 items-center justify-center rounded-lg border-gray-200 text-gray-500 lg:h-11 lg:w-11 lg:bg-transparent xl:border dark:border-gray-800 dark:text-gray-400 dark:lg:bg-transparent ${
              isMobileOpen ? "bg-gray-100 dark:bg-white/3" : ""
            }`}
            onClick={handleToggle}
            aria-label={t("toggleSidebar")}
          >
            {isMobileOpen ? (
              <XMarkIcon />
            ) : (
              <HamburgerIcon className="rtl:-scale-x-100" />
            )}
            {/* Cross Icon */}
          </button>

          <Link to="/" className="xl:hidden">
            <img
              className="dark:hidden"
              src="/images/logo/logo.svg"
              alt="Logo"
            />
            <img
              className="hidden dark:block"
              src="/images/logo/logo-dark.svg"
              alt="Logo"
            />
          </Link>

          <button
            onClick={toggleApplicationMenu}
            className="z-99999 flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 xl:hidden dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <AppMenuDotsIcon />
          </button>

          <div className="hidden xl:block">
            <form>
              <div className="relative">
                <span className="pointer-events-none absolute inset-s-4 top-1/2 -translate-y-1/2">
                  <SearchIcon className="fill-gray-500 dark:fill-gray-400" />
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 ps-12 pe-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden xl:w-107.5 dark:border-gray-800 dark:bg-white/3 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
                <button className="absolute inset-e-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-1.75 py-[4.5px] text-xs tracking-[-0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/3 dark:text-gray-400">
                  <span> ⌘ </span>
                  <span> K </span>
                </button>
              </div>
            </form>
          </div>
        </div>
        <div
          className={cn(
            "flex w-full items-center justify-between gap-4 px-5 py-4 shadow-theme-md xl:flex xl:justify-end xl:px-0 xl:shadow-none",
            isApplicationMenuOpen ? "flex" : "hidden",
          )}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            {/* <!-- Dark Mode Toggler --> */}
            <ThemeToggleButton />
            {/* <!-- Dark Mode Toggler --> */}

            <NotificationDropdown />

            {/* <!-- Notification Menu Area --> */}
          </div>
          {/* <!-- User Area --> */}
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
