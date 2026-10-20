import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import React from "react";
import { useTranslation } from "react-i18next";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="relative z-1 bg-white px-6 sm:px-0 dark:bg-gray-900">
      <div className="relative flex min-h-screen w-full flex-col lg:flex-row dark:bg-gray-900">
        {children}
        <div className="hidden w-full items-center bg-brand-950 lg:grid lg:w-1/2 dark:bg-white/5">
          <div className="relative z-1 flex items-center justify-center">
            <GridShape />

            <div className="flex max-w-xs flex-col items-center text-center">
              <span
                aria-hidden="true"
                className="mb-5 flex size-14 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold tracking-tight text-white"
              >
                NP
              </span>
              <p className="text-2xl font-semibold text-white">
                {t("app.name")}
              </p>
              <p className="mt-2 text-gray-400 dark:text-white/60">
                {t("app.tagline")}
              </p>
            </div>
          </div>
        </div>

        <div className="fixed inset-e-6 bottom-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
