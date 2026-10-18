import { useEffect, useState } from "react";
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

export function HistorialScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ sets: SetResult[]; feedback: ExerciseFeedback[] } | null>(null);

  useEffect(() => {
    listSessions().then(setSessions);
  }, []);

  const toggleOpen = async (session: WorkoutSession) => {
    if (openId === session.id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    const [sets, feedback] = await Promise.all([getSetsForSession(session.id), getFeedbackForSession(session.id)]);
    setDetail({ sets, feedback });
    setOpenId(session.id);
  };

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
      <p className="text-muted">Descarga un archivo con todas tus sesiones a este teléfono.</p>

      {sessions.length === 0 && <p className="text-muted">Todavía no hay sesiones guardadas.</p>}

      <ul className="session-list">
        {sessions.map((session) => {
          const open = openId === session.id;
          const status = STATUS[session.status];
          return (
            <li key={session.id} className={`session-list__item${open ? " session-list__item--current" : ""}`}>
              <button
                className="session-list__header"
                aria-expanded={open}
                aria-controls={`sess-${session.id}`}
                onClick={() => toggleOpen(session)}
              >
                <span className="session-list__header-main">
                  <span className="session-list__date">
                    {new Date(session.startedAt).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })} · Día {session.day}
                  </span>
                  <span className="session-list__summary">
                    {session.exerciseOrder.length} ejercicios{session.rpe != null ? ` · RPE ${session.rpe}` : ""}
                  </span>
                </span>
                <Badge variant={status.variant}>{status.label}</Badge>
                <Icon name={open ? "chevron-up" : "chevron-down"} size={22} />
              </button>

              {open && detail && (
                <div id={`sess-${session.id}`} className="session-list__detail">
                  {session.sessionNote && <p className="text-muted">{session.sessionNote}</p>}
                  <ul className="set-history">
                    {session.exerciseOrder.map((exerciseId) => {
                      const name = getExercise(exerciseId)?.name ?? exerciseId;
                      const exSets = detail.sets.filter((s) => s.exerciseId === exerciseId);
                      const fb = detail.feedback.find((f) => f.exerciseId === exerciseId);
                      const isSkipped = session.skippedExerciseIds.includes(exerciseId);
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
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
