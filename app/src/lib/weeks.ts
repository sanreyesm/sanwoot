import { PRESCRIPTION_TOTAL_WEEKS, WEEKS, getPrescription, getWeekPlan, weekForVersion } from "../data/prescription";
import type { Day, WorkoutSession } from "../types";

export const DAYS: Day[] = [1, 2];

// Las semanas 1 y 2 se hicieron antes de que la app supiera de semanas, y no
// hay garantía de que cada día tenga su sesión guardada en el teléfono. Por
// eso la semana actual se busca desde la 3: las anteriores cuentan como
// pasadas aunque les falte algún registro.
const FIRST_TRACKED_WEEK = 3;

/** Semana de una sesión. Las sesiones antiguas no guardaban la semana, solo la versión de la pauta. */
export function sessionWeek(session: WorkoutSession): number | null {
  return session.week ?? weekForVersion(session.prescriptionVersion);
}

/**
 * Ejercicios que se registran en una sesión: todo menos el calentamiento, que
 * es solo informativo (San empieza a registrar después). Las sesiones nuevas
 * ya no guardan el calentamiento en exerciseOrder; el filtro cubre las antiguas.
 */
export function trainingOrder(session: WorkoutSession): string[] {
  const week = sessionWeek(session);
  if (week == null) return session.exerciseOrder;
  const warmups = new Set(getPrescription(week, session.day).filter((p) => p.isWarmup).map((p) => p.exerciseId));
  return session.exerciseOrder.filter((id) => !warmups.has(id));
}

/** La sesión terminada (completa o parcial) más reciente de esa semana y día. */
export function finishedSessionFor(sessions: WorkoutSession[], week: number, day: Day): WorkoutSession | undefined {
  return sessions
    .filter((s) => s.status !== "active" && s.day === day && sessionWeek(s) === week)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
}

/**
 * La semana actual es la primera (desde la 3) a la que le falta algún día.
 * Al terminar los dos días se pasa sola a la siguiente. Si la siguiente
 * todavía no tiene pauta, la semana actual queda "sin pauta" (getWeekPlan
 * devuelve undefined) hasta que se cargue.
 */
export function computeCurrentWeek(sessions: WorkoutSession[]): number {
  let week = FIRST_TRACKED_WEEK;
  while (week <= PRESCRIPTION_TOTAL_WEEKS && getWeekPlan(week) && DAYS.every((d) => finishedSessionFor(sessions, week, d))) {
    week++;
  }
  return week;
}

export function pastWeeks(currentWeek: number): number[] {
  return WEEKS.map((w) => w.week).filter((w) => w < currentWeek);
}

/** Semanas que la coach ya dejó cargadas pero que todavía no tocan: se pueden mirar, no hacer. */
export function futureWeeks(currentWeek: number): number[] {
  return WEEKS.map((w) => w.week).filter((w) => w > currentWeek);
}
