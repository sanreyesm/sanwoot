import { useEffect, useState } from "react";
import { cacheDemo, isDemoCached } from "../lib/demo-cache";
import type { DemoConfidence } from "../data/demo-map";
import { Badge } from "./Badge";
import { Icon } from "./Icon";

interface DemoPlayerProps {
  file?: string;
  confidence: DemoConfidence;
  note?: string;
  referenceUrl?: string;
}

export function DemoPlayer({ file, confidence, note, referenceUrl }: DemoPlayerProps) {
  const [cached, setCached] = useState<boolean | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    setCached(null);
    isDemoCached(file).then(setCached);
  }, [file]);

  if (confidence === "pending" || !file) {
    return (
      <div className="demo-player demo-player--pending">
        <p className="demo-player__title">Demostración pendiente</p>
        {note && <p className="demo-player__note">{note}</p>}
        {referenceUrl ? (
          <a className="demo-player__link" href={referenceUrl} target="_blank" rel="noreferrer">
            Ver referencia en YouTube (requiere conexión)
          </a>
        ) : (
          <p className="demo-player__note">Sin enlace de referencia disponible.</p>
        )}
      </div>
    );
  }

  const prepare = async () => {
    setPreparing(true);
    setError(null);
    try {
      await cacheDemo(file);
      setCached(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el video.");
    } finally {
      setPreparing(false);
    }
  };

  return (
    <div className="demo-player">
      <video className="demo-player__video" src={`${import.meta.env.BASE_URL}${file}`} controls playsInline loop muted />
      <div className="demo-player__status">
        {cached === null && <span className="text-muted">Comprobando disponibilidad sin conexión…</span>}
        {cached === true && <Badge variant="offline">Disponible offline</Badge>}
        {cached === false && (
          <button className="btn btn--small" onClick={prepare} disabled={preparing}>
            <Icon name="download" size={16} />
            {preparing ? "Guardando…" : "Guardar para sin conexión"}
          </button>
        )}
        {confidence === "approximate" && <Badge variant="approximate">Variante aproximada</Badge>}
      </div>
      {confidence === "approximate" && note && <p className="demo-player__note">{note}</p>}
      {error && <p className="demo-player__note demo-player__note--error">{error}</p>}
    </div>
  );
}
