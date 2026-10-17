// Modelo de datos de SanWoot.
// Basado en la propuesta de la especificación (sección 14), con dos ajustes:
// 1. `sessionOrder` vive en WorkoutSession, no en Prescription: reordenar una
//    sesión no debe tocar ni la prescripción del coach ni otras sesiones.
// 2. SetResult y ExerciseFeedback se escriben en IndexedDB en cada cambio
//    (no solo al cerrar), para que una sesión sea recuperable de verdad.

export type Day = 1 | 2;

export type Floor = "-1" | "3" | "unknown";

/** Catálogo de ejercicios: identidad estable, independiente de la prescripción semanal. */
export interface Exercise {
  id: string;
  name: string;
  originalName: string;
  muscleGroup?: string;
  floor?: Floor;
  equipment?: string;
  /** Referencia de YouTube de la pauta original. Solo online; nunca se hace pasar por offline. */
  referenceUrl?: string;
  /** true si algo de esta ficha (variante, repeticiones, nombre) está pendiente de confirmar con el coach. */
  needsConfirmation: boolean;
  confirmationNote?: string;
}

/** Estado de una demostración en video para un ejercicio. */
export type DemoStatus = "pending" | "available";

export interface DemoAsset {
  exerciseId: string;
  status: DemoStatus;
  /** Ruta pública al mp4 reencodado, relativa a /demos/. Solo si status === 'available'. */
  file?: string;
  originalName?: string;
  sizeBytes?: number;
}

/** Fila de la pauta del coach para un día. Versionada para poder migrar sin perder historial. */
export interface Prescription {
  id: string;
  version: string;
  day: Day;
  exerciseId: string;
  order: number;
  /** Agrupa ejercicios que van en bi-serie, según la regla del coach (LEER ANTES, fila 9/11). */
  block: string;
  sets: number;
  repsText: string | null;
  loadText: string | null;
  coachNote?: string;
  isWarmup: boolean;
}

export type SessionStatus = "active" | "partial" | "complete";
export type ResultSource = "manual" | "coros";

export interface WorkoutSession {
  id: string;
  day: Day;
  prescriptionVersion: string;
  startedAt: string;
  finishedAt?: string;
  status: SessionStatus;
  rpe?: number;
  sessionNote?: string;
  source: ResultSource;
  /** Orden de ejercicios para ESTA sesión. No altera la prescripción. */
  exerciseOrder: string[];
  /** Ejercicios que la usuaria marcó omitidos explícitamente. */
  skippedExerciseIds: string[];
}

export interface SetResult {
  id: string;
  sessionId: string;
  exerciseId: string;
  index: number;
  reps: number | null;
  weightKg: number | null;
  completedAt: string;
  source: ResultSource;
}

export interface ExerciseFeedback {
  sessionId: string;
  exerciseId: string;
  rir: number | null;
  note: string;
  skipped: boolean;
}

export type ClipStatus = "local" | "error";

/**
 * Grabación personal para el coach. Solo estados reales: esta versión no tiene
 * backend de subida, así que no existen 'uploading' | 'verifying' | 'cloud'.
 * Compartir es una acción explícita vía el selector nativo (Web Share API).
 */
export interface PersonalClip {
  id: string;
  sessionId: string | null;
  exerciseId: string;
  createdAt: string;
  mimeType: string;
  size: number;
  durationSeconds?: number;
  status: ClipStatus;
  errorMessage?: string;
  source: "recorded" | "attached";
}
