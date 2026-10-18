import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../state/SessionContext";
import { getPrescription } from "../data/prescription";
import { getExercise } from "../data/exercises";
import { resolveDemoFile } from "../data/demo-map";
import { cacheAllDemos, getCachedDemoCount, type CacheAllProgress } from "../lib/demo-cache";
import { Icon } from "../components/Icon";
import { Badge } from "../components/Badge";
import type { Day } from "../types";

function formatToday(): string {
  const s = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function HoyScreen() {
  const { session, sets, startSession, loading } = useSession();
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
  const pendingExercises = prescription.filter((p) => resolveDemoFile(p.exerciseId).confidence === "pending");

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
    const doneExercises = new Set(sets.map((s) => s.exerciseId));
    const completeCount = session.exerciseOrder.filter(
      (id) => doneExercises.has(id) && !session.skippedExerciseIds.includes(id)
    ).length;
    const skippedCount = session.skippedExerciseIds.length;
    const total = session.exerciseOrder.length;

    const currentId = session.exerciseOrder.find(
      (id) => !doneExercises.has(id) && !session.skippedExerciseIds.includes(id)
    );
    const currentExercise = currentId ? getExercise(currentId) : undefined;

    return (
      <div className="screen">
        <div className="eyebrow">{formatToday()}</div>
        <h1>Hoy</h1>

        <section className="card card--current">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-light-text)" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="5" fill="var(--accent)" /></svg>
              Sesión en curso
            </span>
            <span className="text-muted">desde las {new Date(session.startedAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34 }}>Día {session.day}</h2>
          <div>
            <strong>{completeCount} de {total}</strong> ejercicios con registro
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Badge variant="complete">{completeCount} completos</Badge>
            {skippedCount > 0 && <Badge variant="skipped">{skippedCount} omitido{skippedCount > 1 ? "s" : ""}</Badge>}
            <Badge variant="unregistered">{total - completeCount - skippedCount} sin registrar</Badge>
          </div>
          {currentExercise && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <div className="eyebrow">Ibas en</div>
              <div style={{ fontSize: 17 }}>
                <strong>{currentExercise.name}</strong>
              </div>
            </div>
          )}
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="btn btn--primary btn--large" onClick={() => navigate("/rutina")}>
            Continuar entrenamiento
            <Icon name="arrow-right" size={22} strokeWidth={2.8} />
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button className="btn btn--secondary" onClick={() => navigate("/rutina")}>
              Ver rutina
            </button>
            <button className="btn btn--outline" onClick={() => navigate("/cierre")}>
              Terminar y revisar
            </button>
          </div>
          <div className="text-muted" style={{ textAlign: "center" }}>
            Para cambiar de día, primero termina esta sesión.
          </div>
        </div>

        <section className="card card--muted">
          <p className="card__title">Opciones adicionales</p>
          <button className="btn btn--outline" style={{ width: "100%" }} onClick={() => navigate("/ajustes")}>
            <Icon name="settings" size={18} strokeWidth={2.2} />
            Ajustes
          </button>
        </section>
      </div>
    );
  }

  const ready = cachedCount != null && cachedCount === demoFiles.length;

  return (
    <div className="screen">
      <div className="eyebrow">{formatToday()}</div>
      <h1>Hoy toca</h1>

      <div className="day-picker" role="group" aria-label="Día de entrenamiento">
        {[1, 2].map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={selectedDay === d}
            className={`day-picker__btn${selectedDay === d ? " day-picker__btn--selected" : ""}`}
            onClick={() => setSelectedDay(d as Day)}
          >
            {selectedDay === d && <Icon name="check" size={18} strokeWidth={3} />}
            Día {d}
          </button>
        ))}
      </div>
      <div className="eyebrow">{prescription.length} ejercicios</div>

      <section className="card">
        <p className="card__title">Sin señal</p>
        {cachedCount == null ? (
          <p>Comprobando…</p>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30 }}>
                {cachedCount} de {demoFiles.length}
              </span>
              <span className="text-muted">demostraciones listas</span>
            </div>
            {pendingExercises.length > 0 && (
              <Badge variant="pending">
                Pendientes · {pendingExercises.map((p) => getExercise(p.exerciseId)?.name).join(", ")}
              </Badge>
            )}
            {!ready && (
              <button className="btn btn--secondary" onClick={prepareOffline} disabled={preparing}>
                <Icon name="download" size={20} />
                {preparing && progress ? `Preparando… ${progress.done}/${progress.total}` : "Preparar con wifi"}
              </button>
            )}
            {ready && <Badge variant="offline">Listo para usar sin conexión</Badge>}
          </>
        )}
      </section>

      <button className="btn btn--primary btn--large" onClick={onStart}>
        Comenzar Día {selectedDay}
        <Icon name="arrow-right" size={22} strokeWidth={2.8} />
      </button>

      <section className="card card--muted">
        <p className="card__title">Opciones adicionales</p>
        <button className="btn btn--outline" style={{ width: "100%" }} onClick={() => navigate("/ajustes")}>
          <Icon name="settings" size={18} strokeWidth={2.2} />
          Ajustes
        </button>
      </section>
    </div>
  );
}
