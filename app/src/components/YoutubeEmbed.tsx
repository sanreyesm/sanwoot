import { useEffect, useRef, useState } from "react";
import { loadYoutubeIframeApi } from "../lib/youtube-player";
import { Icon } from "./Icon";

interface YoutubeEmbedProps {
  videoId: string;
  referenceUrl: string;
  vertical?: boolean;
}

// Usa la API oficial del reproductor (no un <iframe src> plano) para poder
// detectar el error 101/150: "el dueño del video no permite reproducción
// embebida en otros sitios". Cuando eso pasa, YouTube de por sí mostraría su
// propia tarjeta de "Watch on YouTube" dentro del iframe -- en vez de eso,
// mostramos una tarjeta propia, consistente con el resto de la app, con un
// enlace directo para abrirlo en YouTube.
export function YoutubeEmbed({ videoId, referenceUrl, vertical }: YoutubeEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBlocked(false);

    loadYoutubeIframeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: { playsinline: 1, modestbranding: 1, rel: 0 },
        events: {
          onError: (e) => {
            if (!cancelled && (e.data === 101 || e.data === 150)) setBlocked(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  const className = `demo-player__embed${vertical ? " demo-player__embed--vertical" : ""}`;

  if (blocked) {
    return (
      <div className={className} style={{ background: "var(--neutral-bg)" }}>
        <div className="demo-player__blocked">
          <Icon name="no-connection" size={22} strokeWidth={2.2} />
          <p style={{ margin: 0, fontWeight: 700 }}>No se puede ver aquí</p>
          <p className="text-muted" style={{ margin: 0, fontSize: 11 }}>
            Quien subió este video a YouTube no permite reproducirlo embebido en otros sitios.
          </p>
          <a className="btn btn--secondary" href={referenceUrl} target="_blank" rel="noreferrer">
            Abrir en YouTube
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
