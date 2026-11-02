import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

// Hoja que sube desde abajo, sobre la pantalla actual. Se cierra con la X,
// tocando el fondo, con Escape o arrastrando el encabezado hacia abajo.
export function BottomSheet({
  eyebrow,
  title,
  onClose,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Evita que la página de atrás se desplace mientras la hoja está abierta.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
      >
        <div
          className="sheet__header"
          onTouchStart={(e) => {
            dragStart.current = e.touches[0].clientY;
          }}
          onTouchMove={(e) => {
            if (dragStart.current == null) return;
            setDragY(Math.max(0, e.touches[0].clientY - dragStart.current));
          }}
          onTouchEnd={() => {
            if (dragY > 90) onClose();
            dragStart.current = null;
            setDragY(0);
          }}
        >
          <span className="sheet__handle" aria-hidden="true" />
          <div className="sheet__title-row">
            <div>
              {eyebrow && <div className="eyebrow">{eyebrow}</div>}
              <h2 id={titleId} className="sheet__title">{title}</h2>
            </div>
            <button className="icon-btn" aria-label="Cerrar" onClick={onClose}>
              <Icon name="close" size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
