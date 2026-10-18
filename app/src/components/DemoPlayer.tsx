import { useEffect, useState } from "react";
import { cacheDemo, isDemoCached } from "../lib/demo-cache";
import type { DemoConfidence } from "../data/demo-map";
import { Badge } from "./Badge";
import { Icon } from "./Icon";
import { YoutubeEmbed } from "./YoutubeEmbed";
import { getYoutubeVideoId, isYoutubeShorts } from "../lib/youtube";

interface DemoPlayerProps {
  file?: string;
  confidence: DemoConfidence;
  note?: string;
  referenceUrl?: string;
  /** Si está presente, se embebe esto en vez de `file`: anulación manual de San. */
  youtubeUrl?: string;
  chosenByUser?: boolean;
}

export function DemoPlayer({ file, confidence, note, referenceUrl, youtubeUrl, chosenByUser }: DemoPlayerProps) {
  const [cached, setCached] = useState<boolean | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file || youtubeUrl) return;
    setCached(null);
    isDemoCached(file).then(setCached);
  }, [file, youtubeUrl]);

  // Video de YouTube elegido a mano por San: siempre tiene prioridad.
  if (youtubeUrl) {
    const videoId = getYoutubeVideoId(youtubeUrl);
    const vertical = isYoutubeShorts(youtubeUrl);
    return (
      <div className="demo-player">
        {videoId ? (
          <YoutubeEmbed videoId={videoId} referenceUrl={youtubeUrl} vertical={vertical} />
        ) : (
          <p className="demo-player__note demo-player__note--error">
            Ese enlace no parece ser de YouTube. Edítalo en "Ajustar este ejercicio".
          </p>
        )}
        <div className="demo-player__status">
          <Badge variant="device">Video elegido por ti</Badge>
        </div>
        <p className="demo-player__note">De YouTube: requiere conexión, no queda guardado para usar sin señal.</p>
      </div>
    );
  }

  if (confidence === "pending" || !file) {
    const videoId = referenceUrl ? getYoutubeVideoId(referenceUrl) : null;
    const vertical = referenceUrl ? isYoutubeShorts(referenceUrl) : false;
    return (
      <div className="demo-player demo-player--pending">
        <p className="demo-player__title">Demostración pendiente</p>
        {note && <p className="demo-player__note">{note}</p>}
        {videoId && referenceUrl ? (
          <>
            <YoutubeEmbed videoId={videoId} referenceUrl={referenceUrl} vertical={vertical} />
            <p className="demo-player__note">Este video es de YouTube: requiere conexión, no queda guardado para usar sin señal.</p>
          </>
        ) : referenceUrl ? (
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
            <Icon name="download" size={13} />
            {preparing ? "Guardando…" : "Guardar para sin conexión"}
          </button>
        )}
        {chosenByUser ? (
          <Badge variant="device">Elegido por ti</Badge>
        ) : (
          confidence === "approximate" && <Badge variant="approximate">Variante aproximada</Badge>
        )}
      </div>
      {!chosenByUser && confidence === "approximate" && note && <p className="demo-player__note">{note}</p>}
      {error && <p className="demo-player__note demo-player__note--error">{error}</p>}
    </div>
  );
}
