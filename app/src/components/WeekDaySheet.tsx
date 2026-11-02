import { useEffect, useState } from "react";
import { getPrescription, getWeekPlan } from "../data/prescription";
import { getExercise } from "../data/exercises";
import { getFeedbackForSession, getSetsForSession } from "../lib/db";
import { BottomSheet } from "./BottomSheet";
import { Badge } from "./Badge";
import type { Day, ExerciseFeedback, Prescription, SetResult, WorkoutSession } from "../types";

// Coma decimal, como se escribe en la planilla ("2,5").
function formatKg(kg: number | null | undefined): string {
  return kg == null ? "-" : String(kg).replace(".", ",");
}

function pautaLine(p: Prescription): string {
  return [`${p.sets} series`, p.repsText, p.loadText].filter(Boolean).join(" · ");
}

// Detalle de un día de una semana que no es la actual: lo que se hizo (si
// hay sesión guardada) junto a la pauta y los comentarios de la coach de ESA
// semana. Las semanas futuras se abren solo para mirar.
export function WeekDaySheet({
  week,
  day,
  session,
  preview,
  onClose,
}: {
  week: number;
  day: Day;
  session?: WorkoutSession;
  /** Semana que todavía no toca: se puede mirar, no hacer. */
  preview?: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<{ sets: SetResult[]; feedback: ExerciseFeedback[] } | null>(null);

  useEffect(() => {
    if (!session) return;
    Promise.all([getSetsForSession(session.id), getFeedbackForSession(session.id)]).then(([sets, feedback]) =>
      setDetail({ sets, feedback })
    );
  }, [session]);

  const prescription = getPrescription(week, day);
  const coachNote = getWeekPlan(week)?.dayCoachNotes[day];

  const groups: { isWarmup: boolean; items: Prescription[] }[] = [];
  for (const p of prescription) {
    const last = groups[groups.length - 1];
    if (last && last.isWarmup === p.isWarmup) last.items.push(p);
    else groups.push({ isWarmup: p.isWarmup, items: [p] });
  }

  return (
    <BottomSheet eyebrow={`Semana ${week}`} title={`Día ${day}`} onClose={onClose}>
      {preview && (
        <p className="text-muted" style={{ margin: 0 }}>
          Solo para mirar: esta semana se habilita cuando termines las anteriores.
        </p>
      )}
      {!preview && session && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
          <Badge variant={session.status === "complete" ? "complete" : "partial"}>
            {session.status === "complete" ? "Completa" : "Parcial"}
          </Badge>
          <span className="text-muted">
            {new Date(session.startedAt).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
            {session.rpe != null ? ` · RPE ${session.rpe}` : ""}
          </span>
        </div>
      )}
      {!preview && !session && (
        <p className="text-muted" style={{ margin: 0 }}>No hay registro de este día en la app. Abajo está la pauta de esa semana.</p>
      )}

      {session?.sessionNote && (
        <div className="sheet-note">
          <span className="sheet-note__label">Tu comentario de fin de sesión</span>
          {session.sessionNote}
        </div>
      )}
      {coachNote && (
        <div className="sheet-note">
          <span className="sheet-note__label">Tu coach</span>
          {coachNote}
        </div>
      )}

      {groups.map((group, gi) => (
        <div key={gi} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h3 className="eyebrow" style={{ margin: "6px 0 0" }}>
            {group.isWarmup ? "Calentamiento" : "Entrenamiento principal"}
          </h3>
          <ul className="sheet-list">
            {group.items.map((p) => {
              const name = getExercise(p.exerciseId)?.name ?? p.exerciseId;
              const exSets = detail?.sets.filter((s) => s.exerciseId === p.exerciseId) ?? [];
              const fb = detail?.feedback.find((f) => f.exerciseId === p.exerciseId);
              const skipped = session?.skippedExerciseIds.includes(p.exerciseId);
              const comments = p.coachComments ?? [];
              return (
                <li key={p.id} className="sheet-list__item">
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Pauta: {pautaLine(p)}</div>
                  {p.coachNote && <div style={{ fontSize: 12 }}>{p.coachNote}</div>}

                  {session && detail && !p.isWarmup && (
                    skipped ? (
                      <Badge variant="skipped">Omitido</Badge>
                    ) : exSets.length === 0 ? (
                      <Badge variant="unregistered">Sin registrar</Badge>
                    ) : (
                      <div style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                        Hiciste: {exSets.map((s) => `${s.reps ?? "–"} × ${formatKg(s.weightKg)}`).join(" · ")} kg
                        {fb?.rir != null && <span className="text-muted"> · RIR {fb.rir}</span>}
                      </div>
                    )
                  )}
                  {fb?.note && <div style={{ fontSize: 12 }}>Tu comentario: &ldquo;{fb.note}&rdquo;</div>}

                  {comments.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 2 }}>
                      <span className="text-muted" style={{ fontSize: 11, fontWeight: 700 }}>Comentarios de tu coach</span>
                      {comments.map((c, i) => (
                        <div key={i} className="sheet-note" style={{ fontSize: 12 }}>{c}</div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </BottomSheet>
  );
}
