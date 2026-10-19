import { ThemeMoonIcon, ThemeSunIcon } from "@/icons";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeTogglerTwo() {
  const { toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex size-14 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600"
    >
      <ThemeSunIcon className="hidden dark:block" />
      <ThemeMoonIcon className="dark:hidden" />
    </button>
  );
}
