import { useEffect, useMemo, useState } from "react";
import { listSessions, getSetsForSession, getFeedbackForSession } from "../lib/db";
import { getExercise } from "../data/exercises";
import { buildBackup, buildSessionsCsv, downloadCsv, downloadJson } from "../lib/export";
import { Icon } from "../components/Icon";
import { Badge, type BadgeVariant } from "../components/Badge";
import type { ExerciseFeedback, SetResult, WorkoutSession } from "../types";

const STATUS: Record<WorkoutSession["status"], { label: string; variant: BadgeVariant }> = {
  active: { label: "Activa", variant: "partial" },
  partial: { label: "Parcial", variant: "partial" },
  complete: { label: "Completa", variant: "complete" },
};

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Construye la grilla del mes, semanas de lunes a domingo, con relleno de
// días de los meses vecinos para completar la cuadrícula.
function buildMonthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const firstWeekday = (first.getDay() + 6) % 7; // 0 = lunes
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - firstWeekday);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

export function HistorialScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ sets: SetResult[]; feedback: ExerciseFeedback[] } | null>(null);

  useEffect(() => {
    listSessions().then((all) => {
      setSessions(all);
      if (all.length > 0) {
        const latest = new Date(all[0].startedAt);
        setMonth(startOfMonth(latest));
        setSelectedDate(dateKey(latest));
      }
    });
  }, []);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    for (const s of sessions) {
      const key = dateKey(new Date(s.startedAt));
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return map;
  }, [sessions]);

  useEffect(() => {
    if (!selectedDate) {
      setDetail(null);
      return;
    }
    const daySessions = sessionsByDate.get(selectedDate);
    if (!daySessions || daySessions.length === 0) {
      setDetail(null);
      return;
    }
    const session = daySessions[0];
    Promise.all([getSetsForSession(session.id), getFeedbackForSession(session.id)]).then(([sets, feedback]) =>
      setDetail({ sets, feedback })
    );
  }, [selectedDate, sessionsByDate]);

  const grid = buildMonthGrid(month);
  const monthLabel = month.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  const todayKey = dateKey(new Date());

  const selectedSession = selectedDate ? sessionsByDate.get(selectedDate)?.[0] : null;

  return (
    <div className="screen">
      <div className="eyebrow">Tus sesiones</div>
      <h1>Historial</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button
          className="btn btn--outline"
          onClick={async () => downloadCsv(await buildSessionsCsv(), `sanwoot-sesiones-${Date.now()}.csv`)}
        >
          <Icon name="download" size={18} /> Exportar CSV
        </button>
        <button
          className="btn btn--outline"
          onClick={async () => downloadJson(await buildBackup(), `sanwoot-respaldo-${Date.now()}.json`)}
        >
          <Icon name="download" size={18} /> Exportar JSON
        </button>
      </div>

      <section className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button className="icon-btn" aria-label="Mes anterior" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
            <Icon name="chevron-left" size={20} strokeWidth={2.6} />
          </button>
          <p className="card__title" style={{ margin: 0, textTransform: "capitalize" }}>{monthLabel}</p>
          <button className="icon-btn" aria-label="Mes siguiente" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
            <Icon name="chevron-right" size={20} strokeWidth={2.6} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4, textAlign: "center" }}>
          {WEEKDAY_LABELS.map((w, i) => (
            <span key={i} className="eyebrow" style={{ fontSize: 11 }}>{w}</span>
          ))}
          {grid.map((d) => {
            const key = dateKey(d);
            const inMonth = d.getMonth() === month.getMonth();
            const daySessions = sessionsByDate.get(key);
            const status = daySessions?.[0]?.status;
            const isSelected = key === selectedDate;
            return (
              <button
                key={key}
                disabled={!daySessions}
                onClick={() => setSelectedDate(key)}
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  border: isSelected ? "2px solid var(--accent)" : "none",
                  borderRadius: 12,
                  background: isSelected ? "var(--accent-light-bg)" : "transparent",
                  color: inMonth ? "var(--ink)" : "var(--border-strong)",
                  fontWeight: key === todayKey ? 800 : 500,
                  fontSize: 15,
                  cursor: daySessions ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {d.getDate()}
                {daySessions && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 4,
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: status === "complete" ? "var(--complete)" : "var(--accent)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {sessions.length === 0 && <p className="text-muted">Todavía no hay sesiones guardadas.</p>}

      {selectedSession && detail && (
        <section className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <p className="card__title" style={{ margin: 0 }}>
              {new Date(selectedSession.startedAt).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })} · Día {selectedSession.day}
            </p>
            <Badge variant={STATUS[selectedSession.status].variant}>{STATUS[selectedSession.status].label}</Badge>
          </div>
          {selectedSession.rpe != null && <p className="text-muted">RPE {selectedSession.rpe}</p>}
          {selectedSession.sessionNote && <p className="text-muted">{selectedSession.sessionNote}</p>}
          <ul className="set-history">
            {selectedSession.exerciseOrder.map((exerciseId) => {
              const name = getExercise(exerciseId)?.name ?? exerciseId;
              const exSets = detail.sets.filter((s) => s.exerciseId === exerciseId);
              const fb = detail.feedback.find((f) => f.exerciseId === exerciseId);
              const isSkipped = selectedSession.skippedExerciseIds.includes(exerciseId);
              if (isSkipped) {
                return (
                  <li key={exerciseId} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{name}</div>
                    <Badge variant="skipped">Omitido</Badge>
                  </li>
                );
              }
              if (exSets.length === 0) {
                return (
                  <li key={exerciseId} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{name}</div>
                    <Badge variant="unregistered">Sin registrar</Badge>
                  </li>
                );
              }
              return (
                <li key={exerciseId} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{name}</div>
                  <div style={{ fontSize: 16, fontVariantNumeric: "tabular-nums" }}>
                    {exSets.map((s) => `${s.reps ?? "–"} × ${s.weightKg ?? "–"}`).join(" · ")} kg
                  </div>
                  {fb?.rir != null && <div className="eyebrow">RIR {fb.rir}</div>}
                  {fb?.note && (
                    <div style={{ fontSize: 15, background: "var(--screen-bg)", borderRadius: 14, padding: "8px 12px" }}>
                      &ldquo;{fb.note}&rdquo;
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
