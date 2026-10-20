import { cn } from "@/utils";

export interface ControlState {
  error?: boolean;
  success?: boolean;
  disabled?: boolean;
}

/**
 * Single source of truth for the look of text inputs, selects and textareas:
 * border, focus ring, error/success and disabled states. Restyle every form
 * control by editing this function.
 */
export const controlClassName = (
  { error = false, success = false, disabled = false }: ControlState,
  className?: string,
) =>
  cn(
    "w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30",
    error
      ? "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:border-error-500 dark:focus:border-error-800"
      : success
        ? "border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:border-success-500 dark:focus:border-success-800"
        : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800",
    disabled &&
      "cursor-not-allowed bg-gray-100 text-gray-500 opacity-50 dark:bg-gray-800 dark:text-gray-400",
    className,
  );

/** Helper / validation text under a control. */
export const controlHintClassName = ({
  error = false,
  success = false,
}: ControlState) =>
  cn(
    "mt-1.5 text-xs",
    error
      ? "text-error-500"
      : success
        ? "text-success-500"
        : "text-gray-500 dark:text-gray-400",
  );
