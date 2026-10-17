import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../state/SessionContext";
import { getPrescription } from "../data/prescription";
import { resolveDemoFile } from "../data/demo-map";
import { cacheAllDemos, getCachedDemoCount, type CacheAllProgress } from "../lib/demo-cache";
import type { Day } from "../types";

export function HoyScreen() {
  const { session, startSession, loading } = useSession();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<Day>(1);
  const [cachedCount, setCachedCount] = useState<number | null>(null);
  const [progress, setProgress] = useState<CacheAllProgress | null>(null);
  const [preparing, setPreparing] = useState(false);

  const prescription = getPrescription(selectedDay);
  const demoFiles = prescription
    .map((p) => resolveDemoFile(p.exerciseId))
    .filter((d) => d.confidence !== "pending" && d.file)
    .map((d) => d.file!) as string[];
  const pendingCount = prescription.length - demoFiles.length;

  useEffect(() => {
    setCachedCount(null);
    getCachedDemoCount(demoFiles).then(setCachedCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  const prepareOffline = async () => {
    setPreparing(true);
    await cacheAllDemos(demoFiles, setProgress);
    const count = await getCachedDemoCount(demoFiles);
    setCachedCount(count);
    setPreparing(false);
    setProgress(null);
  };

  const onStart = async () => {
    await startSession(selectedDay);
    navigate("/rutina");
  };

  if (loading) return <p className="screen-loading">Cargando…</p>;

  if (session && session.status === "active") {
    return (
      <div className="screen">
        <h1>SanWoot</h1>
        <div className="card">
          <p className="card__title">Tienes una sesión activa — Día {session.day}</p>
          <p className="card__subtitle">
            Iniciada {new Date(session.startedAt).toLocaleString("es-CL")}
          </p>
          <button className="btn btn--primary" onClick={() => navigate("/rutina")}>
            Continuar entrenamiento
          </button>
        </div>
      </div>
    );
  }

  const ready = cachedCount != null && cachedCount === demoFiles.length;

  return (
    <div className="screen">
      <h1>SanWoot</h1>

      <div className="card">
        <p className="card__title">Elige tu día</p>
        <div className="day-picker">
          {[1, 2].map((d) => (
            <button
              key={d}
              className={`day-picker__btn${selectedDay === d ? " day-picker__btn--selected" : ""}`}
              onClick={() => setSelectedDay(d as Day)}
            >
              Día {d}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="card__title">Disponibilidad sin conexión</p>
        {cachedCount == null ? (
          <p>Comprobando…</p>
        ) : (
          <>
            <p>
              {cachedCount} de {demoFiles.length} demostraciones con video están guardadas en este
              teléfono.
            </p>
            {pendingCount > 0 && (
              <p className="text-muted">
                {pendingCount} ejercicio(s) de este día no tienen demostración en video todavía; se
                mostrará su enlace de referencia cuando haya conexión.
              </p>
            )}
            {!ready && (
              <button className="btn btn--secondary" onClick={prepareOffline} disabled={preparing}>
                {preparing && progress
                  ? `Preparando… ${progress.done}/${progress.total}`
                  : "Preparar para sin conexión"}
              </button>
            )}
            {ready && <span className="badge badge--ok">Listo para usar sin conexión</span>}
          </>
        )}
      </div>

      <button className="btn btn--primary btn--large" onClick={onStart}>
        Comenzar Día {selectedDay}
      </button>
    </div>
  );
}
