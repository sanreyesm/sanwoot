/// <reference lib="webworker" />
// Service worker de SanWoot.
//
// Dos cachés con responsabilidades distintas:
// - APP_SHELL_CACHE: el bundle de la app (JS/CSS/HTML), precacheado al instalar
//   via self.__WB_MANIFEST (inyectado por vite-plugin-pwa en el build).
// - sanwoot-demos-v1 (ver src/lib/demo-cache.ts): los videos de demostración.
//   NO se precachean al instalar porque son ~13 MB y eso haría la instalación
//   lenta/flaky en una conexión mala; se cachean la primera vez que se pide
//   cada uno (desde <video> o desde "Preparar para sin conexión" en Ajustes),
//   y desde ahí quedan servidos por este mismo handler con soporte de Range,
//   necesario para que el scroll/scrub del video funcione sin internet.

export type {};
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

const APP_SHELL_CACHE = "sanwoot-shell-v1";
const DEMO_CACHE = "sanwoot-demos-v1";

const manifest = self.__WB_MANIFEST || [];
const shellUrls = manifest.map((entry) => entry.url);

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      await cache.addAll(shellUrls);
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== APP_SHELL_CACHE && key !== DEMO_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

function isDemoRequest(url: URL): boolean {
  return url.pathname.startsWith("/demos/") && url.pathname.endsWith(".mp4");
}

async function handleDemoRequest(request: Request): Promise<Response> {
  const cache = await caches.open(DEMO_CACHE);
  let full = await cache.match(request.url, { ignoreSearch: true });

  if (!full) {
    try {
      const networkResponse = await fetch(request.url.split("?")[0]);
      if (!networkResponse.ok) return networkResponse;
      await cache.put(request.url.split("?")[0], networkResponse.clone());
      full = networkResponse;
    } catch {
      return new Response("Sin conexión y sin copia en caché de este video.", {
        status: 503,
        statusText: "Offline",
      });
    }
  }

  const range = request.headers.get("range");
  if (!range) return full;

  // <video> en iOS Safari pide Range incluso para reproducción normal.
  // Cache Storage no sirve Range nativamente, así que se parte el buffer a mano.
  const buffer = await full.clone().arrayBuffer();
  const total = buffer.byteLength;
  const match = /bytes=(\d*)-(\d*)/.exec(range);
  const start = match && match[1] ? parseInt(match[1], 10) : 0;
  const end = match && match[2] ? Math.min(parseInt(match[2], 10), total - 1) : total - 1;

  if (start >= total || start > end) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${total}` },
    });
  }

  const slice = buffer.slice(start, end + 1);
  return new Response(slice, {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": full.headers.get("Content-Type") || "video/mp4",
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Accept-Ranges": "bytes",
      "Content-Length": String(slice.byteLength),
    },
  });
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (isDemoRequest(url)) {
    event.respondWith(handleDemoRequest(event.request));
    return;
  }

  if (event.request.method !== "GET") return;

  // App shell: caché primero, con actualización en segundo plano.
  event.respondWith(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      const cached = await cache.match(event.request);
      if (cached) {
        event.waitUntil(
          fetch(event.request)
            .then((res) => {
              if (res.ok) return cache.put(event.request, res);
            })
            .catch(() => undefined)
        );
        return cached;
      }
      try {
        return await fetch(event.request);
      } catch {
        const fallback = await cache.match("/index.html");
        return fallback || new Response("Sin conexión.", { status: 503 });
      }
    })()
  );
});
