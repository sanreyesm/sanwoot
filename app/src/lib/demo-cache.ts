// Gestión del caché offline de demostraciones (Cache Storage API).
//
// Por qué Cache Storage y no solo el precache del service worker al instalar:
// iOS Safari puede evictar el caché del SW bajo presión de espacio, y la
// especificación exige un "estado comprobable de disponibilidad offline"
// (sección 7), no una promesa. Estas funciones leen y escriben directamente
// el mismo cache que usa el service worker (ver sw.ts), así que el estado
// que muestra la UI es el que realmente usará <video> al reproducir offline.

export const DEMO_CACHE_NAME = "sanwoot-demos-v1";

function demoUrl(file: string): string {
  // import.meta.env.BASE_URL incluye la subruta de despliegue (p. ej. /sanwoot/
  // en GitHub Pages); sin esto, los videos quedan apuntando a la raíz del
  // dominio y dan 404 en cualquier despliegue que no esté en la raíz.
  return new URL(`${import.meta.env.BASE_URL}${file}`, window.location.origin).toString();
}

export async function isDemoCached(file: string): Promise<boolean> {
  if (!("caches" in window)) return false;
  const cache = await caches.open(DEMO_CACHE_NAME);
  const match = await cache.match(demoUrl(file));
  return !!match;
}

export async function cacheDemo(file: string): Promise<void> {
  const cache = await caches.open(DEMO_CACHE_NAME);
  const url = demoUrl(file);
  const existing = await cache.match(url);
  if (existing) return;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo descargar ${file}: HTTP ${response.status}`);
  await cache.put(url, response);
}

export async function removeDemoFromCache(file: string): Promise<void> {
  const cache = await caches.open(DEMO_CACHE_NAME);
  await cache.delete(demoUrl(file));
}

export interface CacheAllProgress {
  done: number;
  total: number;
  currentFile: string;
}

/** Descarga y cachea una lista de archivos, reportando progreso real (no estimado). */
export async function cacheAllDemos(
  files: string[],
  onProgress?: (progress: CacheAllProgress) => void
): Promise<{ ok: string[]; failed: string[] }> {
  const ok: string[] = [];
  const failed: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      await cacheDemo(file);
      ok.push(file);
    } catch {
      failed.push(file);
    }
    onProgress?.({ done: i + 1, total: files.length, currentFile: file });
  }
  return { ok, failed };
}

export async function getCachedDemoCount(files: string[]): Promise<number> {
  if (!("caches" in window)) return 0;
  const cache = await caches.open(DEMO_CACHE_NAME);
  let count = 0;
  for (const file of files) {
    const match = await cache.match(demoUrl(file));
    if (match) count++;
  }
  return count;
}

export async function getDemoCacheBytes(): Promise<number> {
  if (!("caches" in window)) return 0;
  const cache = await caches.open(DEMO_CACHE_NAME);
  const keys = await cache.keys();
  let total = 0;
  for (const key of keys) {
    const res = await cache.match(key);
    if (!res) continue;
    const blob = await res.clone().blob();
    total += blob.size;
  }
  return total;
}

export async function clearDemoCache(): Promise<void> {
  await caches.delete(DEMO_CACHE_NAME);
}
