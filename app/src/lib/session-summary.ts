import { getExercise } from "../data/exercises";
import type { ExerciseFeedback, SetResult, WorkoutSession } from "../types";

// Arma el texto de resumen de sesión que San comparte con su entrenadora
// (hoy vía WhatsApp, a mano: el envío automático sigue sin implementarse).
export function buildSessionSummaryText(
  session: WorkoutSession,
  sets: SetResult[],
  feedback: ExerciseFeedback[]
): string {
  const dateLabel = new Date(session.startedAt).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const lines: string[] = [`Sesión Día ${session.day} · ${dateLabel}`];

  for (const exerciseId of session.exerciseOrder) {
    const exercise = getExercise(exerciseId);
    const name = exercise?.name ?? exerciseId;
    const isSkipped = session.skippedExerciseIds.includes(exerciseId);
    const exSets = sets.filter((s) => s.exerciseId === exerciseId).sort((a, b) => a.index - b.index);
    const fb = feedback.find((f) => f.exerciseId === exerciseId);

    if (isSkipped) {
      lines.push(`\n${name}: omitido`);
      continue;
    }
    if (exSets.length === 0) {
      lines.push(`\n${name}: sin registrar`);
      continue;
    }
    const setsText = exSets.map((s) => `${s.reps ?? "–"}x${s.weightKg ?? "–"}kg`).join(", ");
    lines.push(`\n${name}: ${setsText}`);
    if (fb?.rir != null) lines.push(`RIR ${fb.rir}`);
    if (fb?.note) lines.push(`"${fb.note}"`);
  }

  if (session.rpe != null) lines.push(`\nRPE sesión: ${session.rpe}/10`);
  if (session.sessionNote) lines.push(`Comentario: ${session.sessionNote}`);

  return lines.join("\n");
}

export async function shareSessionSummary(text: string): Promise<"shared" | "copied" | "manual"> {
  if (navigator.share) {
    try {
      await navigator.share({ text, title: "Resumen de sesión" });
      return "shared";
    } catch {
      // cancelado por la usuaria: no es un error, solo no se compartió
    }
  }
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      // sigue al fallback manual
    }
  }
  return "manual";
}
