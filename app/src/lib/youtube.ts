// Extrae el ID de video de una URL de YouTube (watch, shorts o youtu.be).
// Se usa tanto para armar la URL de embed clásica como para pasarle el ID
// a la API oficial del reproductor (ver lib/youtube-player.ts), que es la
// que permite detectar cuando el dueño del video deshabilitó el embed.
export function getYoutubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("youtube.com") && !u.hostname.includes("youtu.be")) return null;

    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1) || null;
    }
    if (u.pathname.startsWith("/shorts/")) {
      return u.pathname.split("/")[2] || null;
    }
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

// Esto es una incrustación normal vía iframe (reproductor oficial de
// YouTube), no una descarga ni redistribución del video: sigue necesitando
// conexión y sigue siendo contenido de terceros.
export function getYoutubeEmbedUrl(url: string): string | null {
  const id = getYoutubeVideoId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

/**
 * Un Short es vertical (9:16), no horizontal (16:9). Si se embebe en un
 * recuadro 16:9 queda chico y pegado a un lado con espacio en blanco
 * alrededor: hay que usar un recuadro vertical para estos casos.
 */
export function isYoutubeShorts(url: string): boolean {
  try {
    return new URL(url).pathname.startsWith("/shorts/");
  } catch {
    return false;
  }
}
