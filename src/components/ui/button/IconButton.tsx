import { cn } from "@/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonTone = "brand" | "success" | "error";

interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "aria-label"
> {
  icon: ReactNode;
  /** Required: used as aria-label and tooltip since there is no visible text. */
  label: string;
  /** Hover color hinting what the action does. */
  tone?: IconButtonTone;
  /** sm (36px) for table rows, md (44px) to align with form inputs. */
  size?: "sm" | "md";
}

const toneClasses: Record<IconButtonTone, string> = {
  brand:
    "hover:border-brand-300 hover:text-brand-500 dark:hover:border-brand-700",
  success:
    "hover:border-success-300 hover:text-success-500 dark:hover:border-success-700",
  error:
    "hover:border-error-300 hover:text-error-500 dark:hover:border-error-700",
};

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  tone = "brand",
  size = "sm",
  type = "button",
  className,
  ...props
}) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    className={cn(
      "inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-800 dark:text-gray-400",
      size === "sm" ? "size-9" : "size-11",
      toneClasses[tone],
      className,
    )}
    {...props}
  >
    {icon}
  </button>
);

export default IconButton;
