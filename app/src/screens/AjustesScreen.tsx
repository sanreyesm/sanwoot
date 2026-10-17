import { useEffect, useState } from "react";
import catalog from "../data/video-catalog.json";
import {
  cacheAllDemos,
  clearDemoCache,
  getDemoCacheBytes,
  type CacheAllProgress,
} from "../lib/demo-cache";
import { getClipsStorageBytes, listClips } from "../lib/clips-db";

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AjustesScreen() {
  const [demoBytes, setDemoBytes] = useState<number | null>(null);
  const [clipBytes, setClipBytes] = useState<number | null>(null);
  const [clipCount, setClipCount] = useState(0);
  const [progress, setProgress] = useState<CacheAllProgress | null>(null);
  const [working, setWorking] = useState(false);

  const refresh = async () => {
    const [demo, clips, clipList] = await Promise.all([
      getDemoCacheBytes(),
      getClipsStorageBytes(),
      listClips(),
    ]);
    setDemoBytes(demo);
    setClipBytes(clips);
    setClipCount(clipList.length);
  };

  useEffect(() => {
    refresh();
  }, []);

  const prepareFullCatalog = async () => {
    setWorking(true);
    const files = (catalog as Array<{ file: string }>).map((c) => c.file);
    await cacheAllDemos(files, setProgress);
    await refresh();
    setWorking(false);
    setProgress(null);
  };

  const clearDemos = async () => {
    await clearDemoCache();
    await refresh();
  };

  return (
    <div className="screen">
      <h1>Ajustes</h1>

      <div className="card">
        <p className="card__title">Demostraciones sin conexión</p>
        <p>
          {demoBytes == null ? "Calculando…" : `${formatMb(demoBytes)} guardados de ${catalog.length} ejercicios del catálogo.`}
        </p>
        <div className="camera-actions">
          <button className="btn btn--secondary" onClick={prepareFullCatalog} disabled={working}>
            {working && progress ? `Preparando… ${progress.done}/${progress.total}` : "Preparar catálogo completo"}
          </button>
          <button className="btn btn--outline" onClick={clearDemos}>Liberar espacio</button>
        </div>
      </div>

      <div className="card">
        <p className="card__title">Videos personales</p>
        <p>{clipCount} clip(s), {clipBytes != null ? formatMb(clipBytes) : "—"} en este dispositivo.</p>
        <p className="text-muted">
          No hay subida a la nube en esta versión: compartir usa el selector nativo del teléfono.
        </p>
      </div>

      <div className="card">
        <p className="card__title">Estado real de conexiones</p>
        <ul className="connection-status">
          <li>📄 Google Sheets — <strong>no conectado</strong>. La pauta mostrada es una copia importada el 15 de octubre de 2026.</li>
          <li>⌚ COROS — <strong>no conectado</strong>.</li>
          <li>📲 Aviso a Telegram por cambios del coach — <strong>pendiente</strong>: falta el token/chat del bot.</li>
        </ul>
      </div>
    </div>
  );
}
