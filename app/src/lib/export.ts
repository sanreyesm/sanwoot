import { getDb, listSessions } from "./db";
import { EXERCISES } from "../data/exercises";
import type { ExerciseFeedback, SetResult, WorkoutSession } from "../types";

// Respaldo JSON de entrenamientos. Deliberadamente NO incluye clips de video
// (ver PersonalClip): esos viven en su propia base (clips-db.ts) y la
// especificación pide que el respaldo de entrenamientos no cargue con blobs
// de video pendientes de subir.

interface BackupPayload {
  exportedAt: string;
  app: "sanwoot";
  version: 1;
  sessions: WorkoutSession[];
  setResults: SetResult[];
  feedback: ExerciseFeedback[];
}

export async function buildBackup(): Promise<BackupPayload> {
  const db = await getDb();
  const sessions = await listSessions();
  const setResults = await db.getAll("setResults");
  const feedback = await db.getAll("feedback");
  return {
    exportedAt: new Date().toISOString(),
    app: "sanwoot",
    version: 1,
    sessions,
    setResults,
    feedback,
  };
}

export function downloadJson(payload: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  triggerDownload(blob, filename);
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function buildSessionsCsv(): Promise<string> {
  const db = await getDb();
  const sessions = await listSessions();
  const setResults = await db.getAll("setResults");
  const feedback = await db.getAll("feedback");

  const header = [
    "fecha_inicio",
    "dia",
    "estado",
    "ejercicio",
    "serie",
    "reps",
    "peso_kg",
    "rir",
    "comentario",
    "rpe_sesion",
  ];
  const rows: string[][] = [];

  for (const session of sessions) {
    const sessionSets = setResults.filter((s) => s.sessionId === session.id);
    const byExercise = new Map<string, SetResult[]>();
    for (const s of sessionSets) {
      byExercise.set(s.exerciseId, [...(byExercise.get(s.exerciseId) ?? []), s]);
    }
    const exerciseIds = new Set([...byExercise.keys(), ...session.skippedExerciseIds]);
    for (const exerciseId of exerciseIds) {
      const exercise = EXERCISES.find((e) => e.id === exerciseId);
      const name = exercise?.name ?? exerciseId;
      const fb = feedback.find((f) => f.sessionId === session.id && f.exerciseId === exerciseId);
      const sets = byExercise.get(exerciseId) ?? [];
      if (sets.length === 0) {
        rows.push([
          session.startedAt,
          String(session.day),
          session.status,
          name,
          "",
          "",
          "",
          fb?.rir != null ? String(fb.rir) : "",
          fb?.note ?? "",
          session.rpe != null ? String(session.rpe) : "",
        ]);
      } else {
        for (const set of sets) {
          rows.push([
            session.startedAt,
            String(session.day),
            session.status,
            name,
            String(set.index + 1),
            set.reps != null ? String(set.reps) : "",
            set.weightKg != null ? String(set.weightKg) : "",
            fb?.rir != null ? String(fb.rir) : "",
            fb?.note ?? "",
            session.rpe != null ? String(session.rpe) : "",
          ]);
        }
      }
    }
  }

  const lines = [header, ...rows].map((row) => row.map(csvEscape).join(","));
  return lines.join("\n");
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
