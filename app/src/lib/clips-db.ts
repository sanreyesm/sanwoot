import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { PersonalClip } from "../types";

interface ClipsDB extends DBSchema {
  clips: {
    key: string;
    value: PersonalClip;
    indexes: { "by-session": string; "by-exercise": string };
  };
  blobs: {
    key: string; // mismo id que el clip
    value: Blob;
  };
}

const DB_NAME = "sanwoot-videos";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ClipsDB>> | null = null;

function getClipsDb(): Promise<IDBPDatabase<ClipsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ClipsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const clips = db.createObjectStore("clips", { keyPath: "id" });
        clips.createIndex("by-session", "sessionId");
        clips.createIndex("by-exercise", "exerciseId");
        db.createObjectStore("blobs");
      },
    });
  }
  return dbPromise;
}

export async function saveClip(meta: PersonalClip, blob: Blob): Promise<void> {
  const db = await getClipsDb();
  const tx = db.transaction(["clips", "blobs"], "readwrite");
  await tx.objectStore("clips").put(meta);
  await tx.objectStore("blobs").put(blob, meta.id);
  await tx.done;
}

export async function updateClipMeta(meta: PersonalClip): Promise<void> {
  const db = await getClipsDb();
  await db.put("clips", meta);
}

export async function getClip(id: string): Promise<PersonalClip | undefined> {
  const db = await getClipsDb();
  return db.get("clips", id);
}

export async function getClipBlob(id: string): Promise<Blob | undefined> {
  const db = await getClipsDb();
  return db.get("blobs", id);
}

export async function listClips(): Promise<PersonalClip[]> {
  const db = await getClipsDb();
  const all = await db.getAll("clips");
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listClipsForSession(sessionId: string): Promise<PersonalClip[]> {
  const db = await getClipsDb();
  return db.getAllFromIndex("clips", "by-session", sessionId);
}

export async function listClipsForExercise(exerciseId: string): Promise<PersonalClip[]> {
  const db = await getClipsDb();
  return db.getAllFromIndex("clips", "by-exercise", exerciseId);
}

export async function deleteClip(id: string): Promise<void> {
  const db = await getClipsDb();
  const tx = db.transaction(["clips", "blobs"], "readwrite");
  await tx.objectStore("clips").delete(id);
  await tx.objectStore("blobs").delete(id);
  await tx.done;
}

/** Espacio total ocupado por clips personales, para la pantalla de Ajustes. */
export async function getClipsStorageBytes(): Promise<number> {
  const clips = await listClips();
  return clips.reduce((sum, c) => sum + c.size, 0);
}
