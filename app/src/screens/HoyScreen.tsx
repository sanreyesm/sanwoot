import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../state/SessionContext";
import { getPrescription, getWeekPlan, PRESCRIPTION_TOTAL_WEEKS } from "../data/prescription";
import { getSetsForSession } from "../lib/db";
import { DAYS, finishedSessionFor, futureWeeks, pastWeeks, sessionWeek, trainingOrder } from "../lib/weeks";
import { WeekDaySheet } from "../components/WeekDaySheet";
import { getExercise } from "../data/exercises";
import { resolveDemoFile } from "../data/demo-map";
import { cacheAllDemos, getCachedDemoCount, type CacheAllProgress } from "../lib/demo-cache";
import { Icon } from "../components/Icon";
import { Badge } from "../components/Badge";
import type { Day, WorkoutSession } from "../types";

function formatToday(): string {
  const s = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const FLOOR_LABEL: Record<string, string> = { "-1": "Piso -1", "3": "Piso 3" };

function dayStats(week: number, day: Day) {
  const prescription = getPrescription(week, day);
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

type Tab = "current" | "past";

interface OpenSheet {
  week: number;
  day: Day;
  session?: WorkoutSession;
  preview?: boolean;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });
}

export function HoyScreen() {
  const { session, sets, loading, allSessions, currentWeek, refreshSessions } = useSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("current");
  const [openSheet, setOpenSheet] = useState<OpenSheet | null>(null);
  const [setCounts, setSetCounts] = useState<Record<string, number>>({});
  const [cachedByDay, setCachedByDay] = useState<Record<Day, number | null>>({ 1: null, 2: null });
  const [preparingDay, setPreparingDay] = useState<Day | null>(null);
  const [progress, setProgress] = useState<CacheAllProgress | null>(null);

  const plan = getWeekPlan(currentWeek);
  const stats1 = dayStats(currentWeek, 1);
  const stats2 = dayStats(currentWeek, 2);

  // Historial puede haber borrado sesiones mientras esta pantalla no estaba montada.
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  useEffect(() => {
    getCachedDemoCount(stats1.demoFiles).then((n) => setCachedByDay((c) => ({ ...c, 1: n })));
    getCachedDemoCount(stats2.demoFiles).then((n) => setCachedByDay((c) => ({ ...c, 2: n })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek]);

  // Series registradas por sesión terminada, para el resumen de cada tarjeta.
  const finishedSessions = useMemo(() => allSessions.filter((s) => s.status !== "active"), [allSessions]);
  useEffect(() => {
    Promise.all(finishedSessions.map(async (s) => [s.id, (await getSetsForSession(s.id)).length] as const)).then((pairs) =>
      setSetCounts(Object.fromEntries(pairs))
    );
  }, [finishedSessions]);

  const prepareOffline = async (day: Day) => {
    const { demoFiles } = day === 1 ? stats1 : stats2;
    setPreparingDay(day);
    await cacheAllDemos(demoFiles, setProgress);
    const count = await getCachedDemoCount(demoFiles);
    setCachedByDay((c) => ({ ...c, [day]: count }));
    setPreparingDay(null);
    setProgress(null);
  };

  if (loading) return <p className="screen-loading">Cargando…</p>;

  const renderActiveSession = (session: WorkoutSession) => {
    const doneExercises = new Set(sets.map((s) => s.exerciseId));
    const order = trainingOrder(session);
    const completeCount = order.filter(
      (id) => doneExercises.has(id) && !session.skippedExerciseIds.includes(id)
    ).length;
    const skippedCount = session.skippedExerciseIds.length;
    const total = order.length;

    const currentId = order.find(
      (id) => !doneExercises.has(id) && !session.skippedExerciseIds.includes(id)
    );
    const currentExercise = currentId ? getExercise(currentId) : undefined;

    return (
      <>
        <section className="card card--current">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-light-text)" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="5" fill="var(--accent)" /></svg>
              Sesión en curso
            </span>
            <span className="text-muted">desde las {new Date(session.startedAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 27 }}>Día {session.day}</h2>
          <div className="text-muted">Semana {sessionWeek(session) ?? currentWeek}</div>
          <div>
            <strong>{completeCount} de {total}</strong> ejercicios con registro
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            <Badge variant="complete">{completeCount} completos</Badge>
            {skippedCount > 0 && <Badge variant="skipped">{skippedCount} omitido{skippedCount > 1 ? "s" : ""}</Badge>}
            <Badge variant="unregistered">{total - completeCount - skippedCount} sin registrar</Badge>
          </div>
          {currentExercise && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <div className="eyebrow">Ibas en</div>
              <div style={{ fontSize: 14 }}>
                <strong>{currentExercise.name}</strong>
              </div>
            </div>
          )}
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="btn btn--primary btn--large" onClick={() => navigate("/rutina")}>
            Continuar entrenamiento
            <Icon name="arrow-right" size={18} strokeWidth={2.8} />
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
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
      </>
    );
  };

  const renderDayCard = (day: Day) => {
    const { prescription, totalSets, floors, demoFiles, pendingExercises } = day === 1 ? stats1 : stats2;
    const cachedCount = cachedByDay[day];
    const ready = cachedCount != null && cachedCount === demoFiles.length;

    return (
      <section key={day} className="card" style={{ gap: 11 }}>
        <button
          type="button"
          onClick={() => navigate(`/dia/${day}`)}
          style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 6 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 27 }}>Día {day}</h2>
            <Icon name="chevron-right" size={19} strokeWidth={2.4} />
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {prescription.length} ejercicios · {totalSets} series{floors.length > 0 ? ` · ${floors.map((f) => FLOOR_LABEL[f]).join(" y ")}` : ""}
          </div>
        </button>

        {plan?.dayCoachNotes[day] && (
          <div style={{ fontSize: 13, background: "var(--screen-bg)", borderRadius: 8, padding: "8px 10px" }}>
            <span className="text-muted" style={{ fontSize: 11, fontWeight: 700, display: "block" }}>Tu coach</span>
            {plan.dayCoachNotes[day]}
          </div>
        )}

        {cachedCount == null ? (
          <p className="text-muted" style={{ margin: 0 }}>Comprobando demostraciones…</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
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
                  <Icon name="download" size={11} />
                  {preparingDay === day && progress ? `${progress.done}/${progress.total}` : "Preparar con wifi"}
                </button>
              </>
            )}
            {pendingExercises.length > 0 && (
              <span className="text-muted" style={{ fontSize: 10 }}>
                {pendingExercises.length} ejercicio(s) sin video del catálogo.
              </span>
            )}
          </div>
        )}

        <button className="btn btn--primary btn--large" onClick={() => navigate(`/dia/${day}`)}>
          Ver rutina
          <Icon name="arrow-right" size={18} strokeWidth={2.8} />
        </button>
      </section>
    );
  };

  // Fila de un día dentro de una tarjeta de semana: abre el detalle en una hoja.
  const renderDayRow = (week: number, day: Day, preview: boolean) => {
    const done = preview ? undefined : finishedSessionFor(allSessions, week, day);
    const prescription = getPrescription(week, day);
    const totalSets = prescription.reduce((sum, p) => sum + p.sets, 0);
    const trainingSets = prescription.filter((p) => !p.isWarmup).reduce((sum, p) => sum + p.sets, 0);
    let summary: string;
    if (preview) summary = `${prescription.length} ejercicios · ${totalSets} series`;
    else if (done) summary = [shortDate(done.startedAt), done.rpe != null ? `RPE ${done.rpe}` : null, `${setCounts[done.id] ?? "…"} de ${trainingSets} series`].filter(Boolean).join(" · ");
    else summary = "Sin registro en la app";

    return (
      <button key={day} type="button" className="day-row" onClick={() => setOpenSheet({ week, day, session: done, preview })}>
        <span className="day-row__main">
          <span className="day-row__title">Día {day}</span>
          <span className="day-row__meta">{summary}</span>
        </span>
        {preview ? (
          <Badge variant="pending">Solo para ver</Badge>
        ) : done ? (
          <Badge variant={done.status === "complete" ? "complete" : "partial"}>{done.status === "complete" ? "Completa" : "Parcial"}</Badge>
        ) : null}
        <Icon name="chevron-right" size={18} strokeWidth={2.4} />
      </button>
    );
  };

  const renderWeekCard = (week: number, preview: boolean) => (
    <section key={week} className="card" style={{ gap: 6 }}>
      <h2 className="week-card__title">Semana {week}</h2>
      {DAYS.map((day) => renderDayRow(week, day, preview))}
    </section>
  );

  const pendingDays = plan ? DAYS.filter((d) => !finishedSessionFor(allSessions, currentWeek, d)) : [];
  const doneDays = plan ? DAYS.filter((d) => finishedSessionFor(allSessions, currentWeek, d)) : [];
  const upcoming = futureWeeks(currentWeek);
  const past = pastWeeks(currentWeek).reverse();
  const activeSession = session && session.status === "active" ? session : null;

  const renderCurrentTab = () => {
    if (activeSession) return renderActiveSession(activeSession);
    if (!plan) {
      return (
        <section className="card">
          <p className="card__title">Semana {currentWeek}</p>
          <p style={{ margin: 0 }}>
            {currentWeek > PRESCRIPTION_TOTAL_WEEKS
              ? "Terminaste las semanas de este ciclo. Tu coach tiene que cargar el siguiente."
              : "Tu coach todavía no carga la pauta de esta semana."}
          </p>
        </section>
      );
    }
    return (
      <>
        <p className="text-muted" style={{ margin: 0 }}>
          Semana {currentWeek} de {PRESCRIPTION_TOTAL_WEEKS}. {pendingDays.length === 1 ? "Te queda 1 día." : `Te quedan ${pendingDays.length} días.`} Toca una rutina para ver el detalle y empezar.
        </p>
        {pendingDays.map((day) => renderDayCard(day))}
        {doneDays.length > 0 && (
          <section className="card" style={{ gap: 6 }}>
            <p className="card__title">Ya hiciste esta semana</p>
            {doneDays.map((day) => renderDayRow(currentWeek, day, false))}
          </section>
        )}
      </>
    );
  };

  return (
    <div className="screen">
      <div className="eyebrow">{formatToday()}</div>

      <div className="segmented" role="tablist" aria-label="Semanas">
        <button role="tab" aria-selected={tab === "current"} className={`segmented__btn${tab === "current" ? " segmented__btn--selected" : ""}`} onClick={() => setTab("current")}>
          Semana {currentWeek}
        </button>
        <button role="tab" aria-selected={tab === "past"} className={`segmented__btn${tab === "past" ? " segmented__btn--selected" : ""}`} onClick={() => setTab("past")}>
          Semanas pasadas
        </button>
      </div>

      {tab === "current" ? (
        <>
          {renderCurrentTab()}
          {upcoming.length > 0 && (
            <>
              <h2 className="eyebrow" style={{ margin: "6px 0 0" }}>Lo que viene</h2>
              {upcoming.map((week) => renderWeekCard(week, true))}
            </>
          )}
        </>
      ) : past.length > 0 ? (
        past.map((week) => renderWeekCard(week, false))
      ) : (
        <p className="text-muted">Todavía no hay semanas pasadas.</p>
      )}

      <section className="card card--muted">
        <p className="card__title">Opciones adicionales</p>
        <button className="btn btn--outline" style={{ width: "100%" }} onClick={() => navigate("/ajustes")}>
          <Icon name="settings" size={14} strokeWidth={2.2} />
          Ajustes
        </button>
      </section>

      {openSheet && (
        <WeekDaySheet
          week={openSheet.week}
          day={openSheet.day}
          session={openSheet.session}
          preview={openSheet.preview}
          onClose={() => setOpenSheet(null)}
        />
      )}
    </div>
  );
}
