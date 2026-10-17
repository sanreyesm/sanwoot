import { useEffect, useState } from "react";
import { listSessions, getSetsForSession, getFeedbackForSession } from "../lib/db";
import { getExercise } from "../data/exercises";
import { buildBackup, buildSessionsCsv, downloadCsv, downloadJson } from "../lib/export";
import type { ExerciseFeedback, SetResult, WorkoutSession } from "../types";

const STATUS_LABEL: Record<WorkoutSession["status"], string> = {
  active: "Activa",
  partial: "Parcial",
  complete: "Completa",
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
    const [sets, feedback] = await Promise.all([
      getSetsForSession(session.id),
      getFeedbackForSession(session.id),
    ]);
    setDetail({ sets, feedback });
    setOpenId(session.id);
  };

  return (
    <div className="screen">
      <h1>Historial</h1>

      <div className="card">
        <p className="card__title">Respaldo</p>
        <div className="camera-actions">
          <button
            className="btn btn--secondary"
            onClick={async () => downloadJson(await buildBackup(), `sanwoot-respaldo-${Date.now()}.json`)}
          >
            Exportar JSON
          </button>
          <button
            className="btn btn--secondary"
            onClick={async () => downloadCsv(await buildSessionsCsv(), `sanwoot-sesiones-${Date.now()}.csv`)}
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {sessions.length === 0 && <p className="text-muted">Todavía no hay sesiones guardadas.</p>}

      <ul className="session-list">
        {sessions.map((session) => (
          <li key={session.id} className="session-list__item">
            <button className="session-list__header" onClick={() => toggleOpen(session)}>
              <span>
                {new Date(session.startedAt).toLocaleDateString("es-CL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                — Día {session.day}
              </span>
              <span className={`badge badge--${session.status === "complete" ? "ok" : session.status === "partial" ? "pending" : "muted"}`}>
                {STATUS_LABEL[session.status]}
              </span>
            </button>

            {openId === session.id && detail && (
              <div className="session-list__detail">
                {session.rpe != null && <p>RPE de la sesión: {session.rpe}</p>}
                {session.sessionNote && <p className="text-muted">{session.sessionNote}</p>}
                <ul className="set-history">
                  {session.exerciseOrder.map((exerciseId) => {
                    const name = getExercise(exerciseId)?.name ?? exerciseId;
                    const exSets = detail.sets.filter((s) => s.exerciseId === exerciseId);
                    const fb = detail.feedback.find((f) => f.exerciseId === exerciseId);
                    const isSkipped = session.skippedExerciseIds.includes(exerciseId);
                    if (isSkipped) return <li key={exerciseId}>➖ {name} — omitido</li>;
                    if (exSets.length === 0) return <li key={exerciseId}>⬜ {name} — sin registrar</li>;
                    return (
                      <li key={exerciseId}>
                        ✅ {name}:{" "}
                        {exSets.map((s) => `${s.reps ?? "–"}×${s.weightKg ?? "–"}kg`).join(", ")}
                        {fb?.rir != null ? ` · RIR ${fb.rir}` : ""}
                        {fb?.note ? ` · “${fb.note}”` : ""}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
