import { ThemeMoonIcon, ThemeSunIcon } from "@/icons";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "react-i18next";

export const ThemeToggleButton: React.FC = () => {
  const { toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("header.toggleTheme")}
      title={t("header.toggleTheme")}
      className="flex size-10 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-none"
    >
      <ThemeSunIcon className="hidden dark:block" />
      <ThemeMoonIcon className="dark:hidden" />
    </button>
  );
};
