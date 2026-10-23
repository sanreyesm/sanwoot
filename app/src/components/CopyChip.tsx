import { useState } from "react";
import { Icon } from "./Icon";

// Botón chico para copiar un valor y pegarlo en la columna que corresponde
// del Sheet de la coach (REPS, CARGA, COMENTARIO, RIR, RPE).
export function CopyChip({ label, value }: { label: string; value: string }) {
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
    <button type="button" className="copy-chip" onClick={copy} aria-label={`Copiar ${label}: ${value}`}>
      <span className="copy-chip__label">{label}</span>
      <span className="copy-chip__value">{value}</span>
      <Icon name={copied ? "check" : "copy"} size={13} strokeWidth={2.4} />
    </button>
  );
}
