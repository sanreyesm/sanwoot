import { useMemo, useState } from "react";
import { CATALOG } from "../data/demo-map";
import { LazyVideoThumb } from "./LazyVideoThumb";
import { Icon } from "./Icon";

interface CatalogOverlayProps {
  onPick: (file: string) => void;
  onClose: () => void;
}

// Pantalla completa a propósito: con 378 videos, un cuadro chico dentro de
// la tarjeta del ejercicio no da espacio para mirar previews de verdad.
export function CatalogOverlay({ onPick, onClose }: CatalogOverlayProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter((c) => c.originalName.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="catalog-overlay">
      <div className="catalog-overlay__header">
        <p className="card__title" style={{ margin: 0 }}>Catálogo de videos</p>
        <button className="icon-btn" aria-label="Cerrar" onClick={onClose}>
          <Icon name="close" size={16} strokeWidth={2.6} />
        </button>
      </div>
      <input
        type="text"
        autoFocus
        placeholder={`Buscar entre ${CATALOG.length} videos…`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="catalog-overlay__search"
      />
      {results.length === 0 && <p className="text-muted" style={{ padding: "0 16px" }}>Sin resultados.</p>}
      <div className="catalog-overlay__grid">
        {results.map((c) => (
          <button key={c.file} className="catalog-thumb-card" onClick={() => onPick(c.file)}>
            <LazyVideoThumb src={c.file} alt={c.originalName} />
            <span className="catalog-thumb-card__name">{c.originalName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
