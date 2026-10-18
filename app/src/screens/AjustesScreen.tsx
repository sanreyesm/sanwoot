import { useEffect, useState } from "react";
import catalog from "../data/video-catalog.json";
import {
  cacheAllDemos,
  clearDemoCache,
  getDemoCacheBytes,
  type CacheAllProgress,
} from "../lib/demo-cache";
import { getClipsStorageBytes, listClips } from "../lib/clips-db";
import { getAllExercises } from "../data/exercises";
import { setOverride } from "../lib/exercise-overrides";
import { MUSCLE_GROUPS, FLOORS } from "../data/exercise-options";
import { Icon } from "../components/Icon";
import { Badge } from "../components/Badge";
import type { Exercise } from "../types";

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AjustesScreen() {
  const [demoBytes, setDemoBytes] = useState<number | null>(null);
  const [clipBytes, setClipBytes] = useState<number | null>(null);
  const [clipCount, setClipCount] = useState(0);
  const [progress, setProgress] = useState<CacheAllProgress | null>(null);
  const [working, setWorking] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>(() => getAllExercises());

  const editExercise = (id: string, patch: { muscleGroup?: string; floor?: Exercise["floor"] }) => {
    setOverride(id, patch);
    setExercises(getAllExercises());
  };

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
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, fontVariantNumeric: "tabular-nums" }}>
            {demoBytes == null ? "…" : `${catalog.length}`}
          </span>
          <span className="text-muted">ejercicios · {demoBytes == null ? "calculando…" : formatMb(demoBytes)}</span>
        </div>
        <p className="text-muted">Necesita wifi. Liberar espacio borra las demostraciones, no tus registros ni tus videos.</p>
        <button className="btn btn--primary" onClick={prepareFullCatalog} disabled={working}>
          <Icon name="download" size={16} />
          {working && progress ? `Preparando… ${progress.done}/${progress.total}` : "Preparar catálogo completo"}
        </button>
        <button className="btn btn--outline" onClick={clearDemos}>Liberar espacio</button>
      </section>

      <section className="card">
        <p className="card__title">Tus videos</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 14 }}><strong>{clipCount} videos</strong> · {clipBytes != null ? formatMb(clipBytes) : "—"}</span>
          <Badge variant="device">Solo en este teléfono</Badge>
        </div>
      </section>

      <section className="card">
        <p className="card__title">Editar ejercicios</p>
        <p className="text-muted">Cambia tren superior/inferior/core o el piso. Se guarda en este teléfono.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {exercises.map((ex) => (
            <div key={ex.id} className="connection-row" style={{ gap: 6 }}>
              <span className="connection-row__name" style={{ fontSize: 13 }}>{ex.name}</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <select
                  className="select"
                  value={ex.muscleGroup ?? ""}
                  onChange={(e) => editExercise(ex.id, { muscleGroup: e.target.value })}
                >
                  <option value="">Sin clasificar</option>
                  {MUSCLE_GROUPS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <select
                  className="select"
                  value={ex.floor ?? "unknown"}
                  onChange={(e) => editExercise(ex.id, { floor: e.target.value as Exercise["floor"] })}
                >
                  {FLOORS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
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
