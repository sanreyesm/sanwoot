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

const FLOOR_LABEL: Record<string, string> = { "-1": "Piso -1", "3": "Piso 3" };

function dayStats(day: Day) {
  const prescription = getPrescription(day);
  const totalSets = prescription.reduce((sum, p) => sum + p.sets, 0);
  const floors = Array.from(
    new Set(
      prescription
        .map((p) => getExercise(p.exerciseId)?.floor)
        .filter((f): f is "-1" | "3" => f === "-1" || f === "3")
    )
  ).sort();
  const demoFiles = prescription
    .map((p) => resolveDemoFile(p.exerciseId))
    .filter((d) => d.confidence !== "pending" && d.file)
    .map((d) => d.file!) as string[];
  const pendingExercises = prescription.filter((p) => resolveDemoFile(p.exerciseId).confidence === "pending");
  return { prescription, totalSets, floors, demoFiles, pendingExercises };
}

export function HoyScreen() {
  const { session, sets, startSession, loading } = useSession();
  const navigate = useNavigate();
  const [cachedByDay, setCachedByDay] = useState<Record<Day, number | null>>({ 1: null, 2: null });
  const [preparingDay, setPreparingDay] = useState<Day | null>(null);
  const [progress, setProgress] = useState<CacheAllProgress | null>(null);

  const stats1 = dayStats(1);
  const stats2 = dayStats(2);

  useEffect(() => {
    getCachedDemoCount(stats1.demoFiles).then((n) => setCachedByDay((c) => ({ ...c, 1: n })));
    getCachedDemoCount(stats2.demoFiles).then((n) => setCachedByDay((c) => ({ ...c, 2: n })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prepareOffline = async (day: Day) => {
    const { demoFiles } = day === 1 ? stats1 : stats2;
    setPreparingDay(day);
    await cacheAllDemos(demoFiles, setProgress);
    const count = await getCachedDemoCount(demoFiles);
    setCachedByDay((c) => ({ ...c, [day]: count }));
    setPreparingDay(null);
    setProgress(null);
  };

  const onStart = async (day: Day) => {
    await startSession(day);
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

  const renderDayCard = (day: Day) => {
    const { prescription, totalSets, floors, demoFiles, pendingExercises } = day === 1 ? stats1 : stats2;
    const cachedCount = cachedByDay[day];
    const ready = cachedCount != null && cachedCount === demoFiles.length;

    return (
      <section key={day} className="card" style={{ gap: 14 }}>
        <button
          type="button"
          onClick={() => onStart(day)}
          style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34 }}>Día {day}</h2>
            <Icon name="chevron-right" size={24} strokeWidth={2.4} />
          </div>
          <div style={{ fontSize: 16, color: "var(--muted)" }}>
            {prescription.length} ejercicios · {totalSets} series{floors.length > 0 ? ` · ${floors.map((f) => FLOOR_LABEL[f]).join(" y ")}` : ""}
          </div>
        </button>

        {cachedCount == null ? (
          <p className="text-muted" style={{ margin: 0 }}>Comprobando demostraciones…</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            {ready ? (
              <Badge variant="offline">Listo para usar sin conexión</Badge>
            ) : (
              <>
                <Badge variant="pending">{cachedCount} de {demoFiles.length} demos listas</Badge>
                <button
                  className="btn btn--small"
                  onClick={(e) => {
                    e.stopPropagation();
                    prepareOffline(day);
                  }}
                  disabled={preparingDay === day}
                >
                  <Icon name="download" size={14} />
                  {preparingDay === day && progress ? `${progress.done}/${progress.total}` : "Preparar con wifi"}
                </button>
              </>
            )}
            {pendingExercises.length > 0 && (
              <span className="text-muted" style={{ fontSize: 13 }}>
                {pendingExercises.length} ejercicio(s) sin video del catálogo.
              </span>
            )}
          </div>
        )}

        <button className="btn btn--primary btn--large" onClick={() => onStart(day)}>
          Comenzar Día {day}
          <Icon name="arrow-right" size={22} strokeWidth={2.8} />
        </button>
      </section>
    );
  };

  return (
    <div className="screen">
      <div className="eyebrow">{formatToday()}</div>
      <h1>Hoy toca</h1>
      <p className="text-muted">Toca una rutina para ver el detalle y empezar.</p>

      {renderDayCard(1)}
      {renderDayCard(2)}

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
