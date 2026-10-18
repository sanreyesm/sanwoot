// Extrae el ID de video de una URL de YouTube (watch o shorts) para poder
// embeberlo con el reproductor oficial de YouTube. Esto es una incrustación
// normal vía iframe, no una descarga ni redistribución del video: sigue
// necesitando conexión y sigue siendo contenido de terceros.
export function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("youtube.com") && !u.hostname.includes("youtu.be")) return null;

    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (u.pathname.startsWith("/shorts/")) {
      const id = u.pathname.split("/")[2];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    const id = u.searchParams.get("v");
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}
