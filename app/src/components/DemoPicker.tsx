import { useState } from "react";
import { CATALOG } from "../data/demo-map";
import { setOverride } from "../lib/exercise-overrides";
import { Icon } from "./Icon";

interface DemoPickerProps {
  exerciseId: string;
  active: boolean;
  onChange: () => void;
}

// Deja a San anular el video de demostración: buscar en el catálogo de 378
// videos locales, o pegar una URL de YouTube propia para embeber. Vive
// aparte de DemoPlayer porque es edición, no reproducción.
export function DemoPicker({ exerciseId, active, onChange }: DemoPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  const results =
    query.trim().length >= 2
      ? CATALOG.filter((c) => c.originalName.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 15)
      : [];

  const pickCatalog = (file: string) => {
    setOverride(exerciseId, { demoFileOverride: file, demoYoutubeOverride: undefined });
    setOpen(false);
    setQuery("");
    onChange();
  };

  const useYoutube = () => {
    const url = youtubeInput.trim();
    if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url)) {
      setYoutubeError("Pega un enlace de YouTube completo (youtube.com o youtu.be).");
      return;
    }
    setYoutubeError(null);
    setOverride(exerciseId, { demoYoutubeOverride: url, demoFileOverride: undefined });
    setOpen(false);
    setYoutubeInput("");
    onChange();
  };

  const clearChoice = () => {
    setOverride(exerciseId, { demoFileOverride: undefined, demoYoutubeOverride: undefined });
    onChange();
  };

  if (!open) {
    return (
      <div className="camera-actions">
        <button className="btn btn--outline" onClick={() => setOpen(true)}>
          <Icon name="video" size={16} strokeWidth={2.2} />
          Cambiar video
        </button>
        {active && (
          <button className="btn btn--neutral" onClick={clearChoice}>
            <Icon name="undo" size={16} />
            Volver al automático
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={{ background: "var(--screen-bg)", boxShadow: "none" }}>
      <p className="card__title">Pegar un enlace de YouTube</p>
      <div className="set-input" style={{ gridTemplateColumns: "1fr auto" }}>
        <input
          type="text"
          inputMode="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={youtubeInput}
          onChange={(e) => setYoutubeInput(e.target.value)}
        />
        <button className="btn btn--secondary" style={{ alignSelf: "stretch" }} onClick={useYoutube}>
          Usar
        </button>
      </div>
      {youtubeError && <p className="demo-player__note demo-player__note--error">{youtubeError}</p>}

      <p className="card__title" style={{ marginTop: 8 }}>O buscar en nuestro catálogo ({CATALOG.length} videos)</p>
      <input
        type="text"
        placeholder="Ej. squat, press, curl…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.trim().length >= 2 && results.length === 0 && <p className="text-muted">Sin resultados.</p>}
      {results.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4, maxHeight: 240, overflowY: "auto" }}>
          {results.map((r) => (
            <li key={r.file}>
              <button
                className="btn btn--outline"
                style={{ width: "100%", justifyContent: "flex-start", minHeight: 44 }}
                onClick={() => pickCatalog(r.file)}
              >
                {r.originalName}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button className="link-btn" style={{ alignSelf: "flex-start", padding: 0, marginTop: 8 }} onClick={() => setOpen(false)}>
        Cancelar
      </button>
    </div>
  );
}
