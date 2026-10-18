import { useState } from "react";
import { setOverride } from "../lib/exercise-overrides";
import { Icon } from "./Icon";
import { CatalogOverlay } from "./CatalogOverlay";

interface DemoPickerProps {
  exerciseId: string;
  active: boolean;
  onChange: () => void;
}

// Deja a San anular el video de demostración: buscar con preview en el
// catálogo de 378 videos locales, o pegar una URL de YouTube propia.
export function DemoPicker({ exerciseId, active, onChange }: DemoPickerProps) {
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [youtubeInput, setYoutubeInput] = useState("");
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  const pickCatalog = (file: string) => {
    setOverride(exerciseId, { demoFileOverride: file, demoYoutubeOverride: undefined });
    setCatalogOpen(false);
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
    setYoutubeOpen(false);
    setYoutubeInput("");
    onChange();
  };

  const clearChoice = () => {
    setOverride(exerciseId, { demoFileOverride: undefined, demoYoutubeOverride: undefined });
    onChange();
  };

  return (
    <>
      <div className="camera-actions">
        <button className="btn btn--outline" onClick={() => setYoutubeOpen(true)}>
          <Icon name="share" size={13} strokeWidth={2.2} />
          Link YouTube
        </button>
        <button className="btn btn--outline" onClick={() => setCatalogOpen(true)}>
          <Icon name="video" size={13} strokeWidth={2.2} />
          Catálogo videos
        </button>
        {active && (
          <button className="btn btn--neutral" onClick={clearChoice}>
            <Icon name="undo" size={13} />
            Volver al automático
          </button>
        )}
      </div>

      {youtubeOpen && (
        <div className="card" style={{ background: "var(--screen-bg)", boxShadow: "none" }}>
          <p className="card__title">Pegar un enlace de YouTube</p>
          <div className="set-input" style={{ gridTemplateColumns: "1fr auto" }}>
            <input
              type="text"
              inputMode="url"
              autoFocus
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeInput}
              onChange={(e) => setYoutubeInput(e.target.value)}
            />
            <button className="btn btn--secondary" style={{ alignSelf: "stretch" }} onClick={useYoutube}>
              Usar
            </button>
          </div>
          {youtubeError && <p className="demo-player__note demo-player__note--error">{youtubeError}</p>}
          <button className="link-btn" style={{ alignSelf: "flex-start", padding: 0 }} onClick={() => setYoutubeOpen(false)}>
            Cancelar
          </button>
        </div>
      )}

      {catalogOpen && <CatalogOverlay onPick={pickCatalog} onClose={() => setCatalogOpen(false)} />}
    </>
  );
}
