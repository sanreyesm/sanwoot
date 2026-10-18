// Carga la API oficial de IFrame Player de YouTube una sola vez, sin
// importar cuántos embeds haya en pantalla. Se usa en vez de un <iframe src>
// plano porque esta API es la única forma de DETECTAR cuando el dueño del
// video deshabilitó la reproducción embebida (error 101/150) y así mostrar
// nuestra propia tarjeta de aviso en vez de la que arma YouTube.

// Tipos mínimos de la API (solo lo que usamos): no vale la pena una
// dependencia completa de @types/youtube por esto. Van dentro de
// `declare global` para que YT.Player sea visible en otros archivos
// (ej. YoutubeEmbed.tsx) sin tener que importarlo.
declare global {
  namespace YT {
    interface OnErrorEvent {
      data: number;
    }
    interface PlayerEvents {
      onReady?: () => void;
      onError?: (event: OnErrorEvent) => void;
    }
    interface PlayerOptions {
      videoId: string;
      host?: string;
      playerVars?: Record<string, number | string>;
      events?: PlayerEvents;
    }
    class Player {
      constructor(element: HTMLElement, options: PlayerOptions);
      destroy(): void;
    }
  }

  interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<typeof YT> | null = null;

export function loadYoutubeIframeApi(): Promise<typeof YT> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });

  return apiPromise;
}
