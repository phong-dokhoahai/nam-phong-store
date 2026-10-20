import { CloseIcon } from "@/icons";
import { cn } from "@/utils";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ModalTitleIdContext, useModalTitleId } from "./modalTitle";

/** sm: confirmations · md: short forms · lg: wide forms · xl: document editors. */
export type ModalSize = "sm" | "md" | "lg" | "xl";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Width and padding preset. Omit to style the panel entirely via `className`. */
  size?: ModalSize;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  isFullscreen?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md p-6",
  md: "max-w-2xl p-6",
  lg: "max-w-3xl p-6",
  xl: "max-w-6xl p-5 sm:p-6",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  size,
  children,
  className,
  showCloseButton = true,
  isFullscreen = false,
}) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal fixed inset-0 z-99999 overflow-y-auto">
      {!isFullscreen && (
        <div
          className="fixed inset-0 h-full w-full bg-gray-950/40 backdrop-blur-[2px]"
          aria-hidden="true"
        ></div>
      )}
      {/* min-h-full + items-center: centered when short, scrollable from the
          top when taller than the viewport (no clipped dialog headers). */}
      <div
        className={cn(
          "relative flex min-h-full items-center justify-center",
          !isFullscreen && "p-4 sm:p-6",
        )}
        onClick={isFullscreen ? undefined : onClose}
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            isFullscreen
              ? "h-full w-full"
              : "relative w-full rounded-2xl bg-white shadow-theme-xl dark:bg-gray-900",
            size && sizeClasses[size],
            className,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.close")}
              className="absolute inset-e-4 top-4 z-999 flex size-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-none"
            >
              <CloseIcon className="size-5" />
            </button>
          )}
          <ModalTitleIdContext.Provider value={titleId}>
            <div>{children}</div>
          </ModalTitleIdContext.Provider>
        </div>
      </div>
    </div>
  );
};

interface ModalHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}

/** Dialog title (names the dialog for screen readers) + optional subtitle. */
export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  description,
  className,
}) => {
  const titleId = useModalTitleId();

  return (
    <div className={cn("pe-12", className)}>
      <h2 id={titleId} className="text-lg font-semibold text-fg">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-fg-muted">{description}</p>
      )}
    </div>
  );
};

/** Action row: buttons stack on mobile (primary on top), align end from `sm`. */
export const ModalFooter: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end",
      className,
    )}
  >
    {children}
  </div>
);
