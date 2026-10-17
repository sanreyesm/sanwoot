import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getActiveSession,
  saveSession,
  upsertSetResult,
  deleteSetResult,
  getSetsForSession,
  upsertFeedback,
  getFeedbackForSession,
} from "../lib/db";
import { PRESCRIPTION_VERSION, getPrescription } from "../data/prescription";
import type { Day, ExerciseFeedback, SetResult, WorkoutSession } from "../types";

interface SessionState {
  session: WorkoutSession | null;
  sets: SetResult[];
  feedback: ExerciseFeedback[];
  loading: boolean;
}

interface SessionApi extends SessionState {
  startSession: (day: Day) => Promise<WorkoutSession>;
  addSet: (exerciseId: string, reps: number | null, weightKg: number | null) => Promise<void>;
  removeSet: (setId: string) => Promise<void>;
  setFeedback: (exerciseId: string, patch: Partial<Omit<ExerciseFeedback, "sessionId" | "exerciseId">>) => Promise<void>;
  toggleSkip: (exerciseId: string) => Promise<void>;
  reorder: (exerciseIds: string[]) => Promise<void>;
  finishSession: (rpe: number, note: string) => Promise<void>;
  discardActiveSessionView: () => void;
}

const SessionCtx = createContext<SessionApi | null>(null);

function newId(): string {
  return crypto.randomUUID();
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ session: null, sets: [], feedback: [], loading: true });

  const loadSets = useCallback(async (sessionId: string) => {
    const [sets, feedback] = await Promise.all([getSetsForSession(sessionId), getFeedbackForSession(sessionId)]);
    setState((s) => ({ ...s, sets, feedback }));
  }, []);

  useEffect(() => {
    (async () => {
      const existing = await getActiveSession();
      if (existing) {
        const [sets, feedback] = await Promise.all([getSetsForSession(existing.id), getFeedbackForSession(existing.id)]);
        setState({ session: existing, sets, feedback, loading: false });
      } else {
        setState({ session: null, sets: [], feedback: [], loading: false });
      }
    })();
  }, []);

  const startSession = useCallback(async (day: Day): Promise<WorkoutSession> => {
    const prescription = getPrescription(day);
    const session: WorkoutSession = {
      id: newId(),
      day,
      prescriptionVersion: PRESCRIPTION_VERSION,
      startedAt: new Date().toISOString(),
      status: "active",
      source: "manual",
      exerciseOrder: prescription.map((p) => p.exerciseId),
      skippedExerciseIds: [],
    };
    await saveSession(session);
    setState({ session, sets: [], feedback: [], loading: false });
    return session;
  }, []);

  const addSet = useCallback(
    async (exerciseId: string, reps: number | null, weightKg: number | null) => {
      setState((prev) => {
        if (!prev.session) return prev;
        const sessionId = prev.session.id;
        const existingForExercise = prev.sets.filter((s) => s.exerciseId === exerciseId);
        const result: SetResult = {
          id: newId(),
          sessionId,
          exerciseId,
          index: existingForExercise.length,
          reps,
          weightKg,
          completedAt: new Date().toISOString(),
          source: "manual",
        };
        upsertSetResult(result); // fire-and-forget: persistencia inmediata en IndexedDB
        return { ...prev, sets: [...prev.sets, result] };
      });
    },
    []
  );

  const removeSet = useCallback(async (setId: string) => {
    setState((prev) => ({ ...prev, sets: prev.sets.filter((s) => s.id !== setId) }));
    await deleteSetResult(setId);
  }, []);

  const setFeedback = useCallback(
    async (exerciseId: string, patch: Partial<Omit<ExerciseFeedback, "sessionId" | "exerciseId">>) => {
      setState((prev) => {
        if (!prev.session) return prev;
        const sessionId = prev.session.id;
        const current = prev.feedback.find((f) => f.exerciseId === exerciseId);
        const updated: ExerciseFeedback = {
          sessionId,
          exerciseId,
          rir: current?.rir ?? null,
          note: current?.note ?? "",
          skipped: current?.skipped ?? false,
          ...patch,
        };
        upsertFeedback(updated);
        const others = prev.feedback.filter((f) => f.exerciseId !== exerciseId);
        return { ...prev, feedback: [...others, updated] };
      });
    },
    []
  );

  const toggleSkip = useCallback(
    async (exerciseId: string) => {
      setState((prev) => {
        if (!prev.session) return prev;
        const skipped = prev.session.skippedExerciseIds.includes(exerciseId);
        const nextSkipped = skipped
          ? prev.session.skippedExerciseIds.filter((id) => id !== exerciseId)
          : [...prev.session.skippedExerciseIds, exerciseId];
        const nextSession = { ...prev.session, skippedExerciseIds: nextSkipped };
        saveSession(nextSession);
        return { ...prev, session: nextSession };
      });
    },
    []
  );

  const reorder = useCallback(async (exerciseIds: string[]) => {
    setState((prev) => {
      if (!prev.session) return prev;
      const nextSession = { ...prev.session, exerciseOrder: exerciseIds };
      saveSession(nextSession);
      return { ...prev, session: nextSession };
    });
  }, []);

  const finishSession = useCallback(async (rpe: number, note: string) => {
    setState((prev) => {
      if (!prev.session) return prev;
      const doneExercises = new Set(prev.sets.map((s) => s.exerciseId));
      const allExercises = prev.session.exerciseOrder;
      const allDone = allExercises.every(
        (id) => doneExercises.has(id) || prev.session!.skippedExerciseIds.includes(id)
      );
      const nextSession: WorkoutSession = {
        ...prev.session,
        status: allDone ? "complete" : "partial",
        finishedAt: new Date().toISOString(),
        rpe,
        sessionNote: note,
      };
      saveSession(nextSession);
      return { ...prev, session: nextSession };
    });
  }, []);

  const discardActiveSessionView = useCallback(() => {
    setState({ session: null, sets: [], feedback: [], loading: false });
  }, []);

  const api = useMemo<SessionApi>(
    () => ({
      ...state,
      startSession,
      addSet,
      removeSet,
      setFeedback,
      toggleSkip,
      reorder,
      finishSession,
      discardActiveSessionView,
    }),
    [state, startSession, addSet, removeSet, setFeedback, toggleSkip, reorder, finishSession, discardActiveSessionView]
  );

  // Se usa para refrescar sets/feedback desde otras pantallas si se navega y vuelve.
  void loadSets;

  return <SessionCtx.Provider value={api}>{children}</SessionCtx.Provider>;
}

export function useSession(): SessionApi {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession debe usarse dentro de SessionProvider");
  return ctx;
}
