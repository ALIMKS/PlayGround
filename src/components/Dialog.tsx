import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  wide?: boolean;
  flush?: boolean;
}

export function Dialog({ open, onClose, children, title, wide, flush }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="dialog-overlay" onClick={onClose} role="presentation">
      <div
        className={`dialog${wide ? " dialog--wide" : ""}${flush ? " dialog--flush" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        {title && (
          <div className="dialog-head">
            <h2>{title}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
        )}
        {!title && (
          <button type="button" className="dialog-close icon-btn" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        )}
        <div className={flush ? "" : "dialog-body"}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
