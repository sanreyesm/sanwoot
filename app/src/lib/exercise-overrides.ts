// Ediciones de San sobre el catálogo base de ejercicios (tren superior/inferior/core
// y piso). Vive en localStorage, no en el código: así no necesita pedirme
// un cambio cada vez. Se aplica por encima de los datos base al leerlos.
import type { Exercise } from "../types";

const STORAGE_KEY = "sanwoot-exercise-overrides";

export type ExerciseOverride = Partial<Pick<Exercise, "muscleGroup" | "floor" | "myNote">>;

function readAll(): Record<string, ExerciseOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, ExerciseOverride>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getOverride(exerciseId: string): ExerciseOverride | undefined {
  return readAll()[exerciseId];
}

export function setOverride(exerciseId: string, patch: ExerciseOverride): void {
  const all = readAll();
  all[exerciseId] = { ...all[exerciseId], ...patch };
  writeAll(all);
}

export function applyOverride(exercise: Exercise): Exercise {
  const override = getOverride(exercise.id);
  return override ? { ...exercise, ...override } : exercise;
}
