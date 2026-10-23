import { useState } from "react";
import { Icon } from "./Icon";

// Ícono para copiar un comentario y pegarlo en la columna COMENTARIO
// (o "Comentarios de fin de sesión") del Sheet de la coach.
export function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // sin permiso de portapapeles: no hay nada útil que mostrar
    }
  };

  return (
    <button type="button" className="copy-btn" onClick={copy} aria-label={copied ? "Copiado" : `Copiar ${label}`}>
      <Icon name={copied ? "check" : "copy"} size={14} strokeWidth={2.4} />
    </button>
  );
}
