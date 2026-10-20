import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the custom @theme scales in index.css. Without this it
// reads `text-theme-sm` as a text color and drops it next to `text-gray-500`.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "theme-xs",
            "theme-sm",
            "theme-xl",
            "title-sm",
            "title-md",
            "title-lg",
            "title-xl",
            "title-2xl",
          ],
        },
      ],
      shadow: [
        {
          shadow: [
            "theme-xs",
            "theme-sm",
            "theme-md",
            "theme-lg",
            "theme-xl",
            "focus-ring",
            "slider-navigation",
            "tooltip",
            "datepicker",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}
