import { useEffect, useState } from "react";
import catalog from "../data/video-catalog.json";
import {
  cacheAllDemos,
  clearDemoCache,
  getDemoCacheBytes,
  type CacheAllProgress,
} from "../lib/demo-cache";
import { getClipsStorageBytes, listClips } from "../lib/clips-db";
import { Icon } from "../components/Icon";
import { Badge } from "../components/Badge";

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
      <div className="eyebrow">Kilogramos · Hora de Santiago</div>
      <h1>Ajustes</h1>

      <section className="card">
        <p className="card__title">Demostraciones guardadas</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 40, fontVariantNumeric: "tabular-nums" }}>
            {demoBytes == null ? "…" : `${catalog.length}`}
          </span>
          <span className="text-muted">ejercicios · {demoBytes == null ? "calculando…" : formatMb(demoBytes)}</span>
        </div>
        <p className="text-muted">Necesita wifi. Liberar espacio borra las demostraciones, no tus registros ni tus videos.</p>
        <button className="btn btn--primary" onClick={prepareFullCatalog} disabled={working}>
          <Icon name="download" size={20} />
          {working && progress ? `Preparando… ${progress.done}/${progress.total}` : "Preparar catálogo completo"}
        </button>
        <button className="btn btn--outline" onClick={clearDemos}>Liberar espacio</button>
      </section>

      <section className="card">
        <p className="card__title">Tus videos</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 17 }}><strong>{clipCount} videos</strong> · {clipBytes != null ? formatMb(clipBytes) : "—"}</span>
          <Badge variant="device">Solo en este teléfono</Badge>
        </div>
      </section>

      <section className="card">
        <p className="card__title">Conexiones</p>
        <p className="text-muted">Ninguna existe todavía. Lo que registras queda en este teléfono y sale por exportación desde Historial.</p>

        <div className="connection-row">
          <div className="connection-row__head">
            <span className="connection-row__name">Google Sheets</span>
            <Badge variant="not-connected">No conectado</Badge>
          </div>
          <div className="text-muted">No implementado. Usa Exportar CSV.</div>
        </div>
        <div className="connection-row">
          <div className="connection-row__head">
            <span className="connection-row__name">COROS</span>
            <Badge variant="not-connected">No conectado</Badge>
          </div>
          <div className="text-muted">No implementado.</div>
        </div>
        <div className="connection-row">
          <div className="connection-row__head">
            <span className="connection-row__name">Aviso a Telegram</span>
            <Badge variant="not-connected">No conectado</Badge>
          </div>
          <div className="text-muted">No implementado.</div>
        </div>
        <div className="connection-row">
          <div className="connection-row__head">
            <span className="connection-row__name">Nube para videos</span>
            <Badge variant="not-connected">No existe</Badge>
          </div>
          <div className="text-muted">Los videos quedan en el teléfono.</div>
        </div>
      </section>
    </div>
  );
}
