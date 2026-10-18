import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { ExerciseFeedback, SetResult, WorkoutSession } from "../types";

interface SanWootDB extends DBSchema {
  sessions: {
    key: string;
    value: WorkoutSession;
    indexes: { "by-status": string; "by-startedAt": string };
  };
  setResults: {
    key: string;
    value: SetResult;
    indexes: { "by-session": string; "by-session-exercise": [string, string] };
  };
  feedback: {
    key: [string, string]; // [sessionId, exerciseId]
    value: ExerciseFeedback;
    indexes: { "by-session": string };
  };
}

const DB_NAME = "sanwoot-v1";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SanWootDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<SanWootDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SanWootDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const sessions = db.createObjectStore("sessions", { keyPath: "id" });
        sessions.createIndex("by-status", "status");
        sessions.createIndex("by-startedAt", "startedAt");

        const sets = db.createObjectStore("setResults", { keyPath: "id" });
        sets.createIndex("by-session", "sessionId");
        sets.createIndex("by-session-exercise", ["sessionId", "exerciseId"]);

        const feedback = db.createObjectStore("feedback", { keyPath: ["sessionId", "exerciseId"] });
        feedback.createIndex("by-session", "sessionId");
      },
    });
  }
  return dbPromise;
}

// --- Sesiones -------------------------------------------------------------

export async function saveSession(session: WorkoutSession): Promise<void> {
  const db = await getDb();
  await db.put("sessions", session);
}

export async function getSession(id: string): Promise<WorkoutSession | undefined> {
  const db = await getDb();
  return db.get("sessions", id);
}

export async function getActiveSession(): Promise<WorkoutSession | undefined> {
  const db = await getDb();
  const all = await db.getAllFromIndex("sessions", "by-status", "active");
  // Solo debería existir una activa a la vez; si hay más de una por un cierre
  // anómalo, se usa la más reciente y las demás quedan como estaban (no se borran).
  return all.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
}

export async function listSessions(): Promise<WorkoutSession[]> {
  const db = await getDb();
  const all = await db.getAll("sessions");
  return all.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

/** Borra la sesión y todo lo que cuelga de ella (series y feedback). Irreversible. */
export async function deleteSession(sessionId: string): Promise<void> {
  const db = await getDb();
  const [sets, feedbackRows] = await Promise.all([
    db.getAllFromIndex("setResults", "by-session", sessionId),
    db.getAllFromIndex("feedback", "by-session", sessionId),
  ]);
  const tx = db.transaction(["sessions", "setResults", "feedback"], "readwrite");
  await Promise.all([
    tx.objectStore("sessions").delete(sessionId),
    ...sets.map((s) => tx.objectStore("setResults").delete(s.id)),
    ...feedbackRows.map((f) => tx.objectStore("feedback").delete([f.sessionId, f.exerciseId])),
  ]);
  await tx.done;
}

// --- Series -----------------------------------------------------------------

export async function upsertSetResult(result: SetResult): Promise<void> {
  const db = await getDb();
  await db.put("setResults", result);
}

export async function deleteSetResult(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("setResults", id);
}

export async function getSetsForSession(sessionId: string): Promise<SetResult[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex("setResults", "by-session", sessionId);
  return all.sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

export async function getSetsForExercise(sessionId: string, exerciseId: string): Promise<SetResult[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex("setResults", "by-session-exercise", [sessionId, exerciseId]);
  return all.sort((a, b) => a.index - b.index);
}

// --- Feedback por ejercicio --------------------------------------------------

export async function upsertFeedback(feedback: ExerciseFeedback): Promise<void> {
  const db = await getDb();
  await db.put("feedback", feedback);
}

export async function getFeedback(sessionId: string, exerciseId: string): Promise<ExerciseFeedback | undefined> {
  const db = await getDb();
  return db.get("feedback", [sessionId, exerciseId]);
}

export async function getFeedbackForSession(sessionId: string): Promise<ExerciseFeedback[]> {
  const db = await getDb();
  return db.getAllFromIndex("feedback", "by-session", sessionId);
}

// --- Último valor realizado por ejercicio (para "últimos valores realizados") ---

export async function getLastSetsForExercise(exerciseId: string, excludeSessionId?: string): Promise<SetResult[]> {
  const db = await getDb();
  const sessions = await listSessions();
  for (const session of sessions) {
    if (session.id === excludeSessionId) continue;
    if (session.status === "active") continue;
    const sets = await db.getAllFromIndex("setResults", "by-session-exercise", [session.id, exerciseId]);
    if (sets.length > 0) return sets.sort((a, b) => a.index - b.index);
  }
  return [];
}
