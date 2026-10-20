import { ThemeMoonIcon, ThemeSunIcon } from "@/icons";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function ThemeTogglerTwo() {
  const { toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("header.toggleTheme")}
      className="inline-flex size-14 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600"
    >
      <ThemeSunIcon className="hidden dark:block" />
      <ThemeMoonIcon className="dark:hidden" />
    </button>
  );
}
