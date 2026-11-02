import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getActiveSession,
  saveSession,
  upsertSetResult,
  deleteSetResult,
  getSetsForSession,
  upsertFeedback,
  getFeedbackForSession,
  listSessions,
} from "../lib/db";
import { getPrescription, getWeekPlan } from "../data/prescription";
import { computeCurrentWeek, trainingOrder } from "../lib/weeks";
import type { Day, ExerciseFeedback, SetResult, WorkoutSession } from "../types";

interface SessionState {
  session: WorkoutSession | null;
  sets: SetResult[];
  feedback: ExerciseFeedback[];
  loading: boolean;
  /** Todas las sesiones guardadas, para saber qué días de cada semana ya se hicieron. */
  allSessions: WorkoutSession[];
}

interface SessionApi extends SessionState {
  currentWeek: number;
  refreshSessions: () => Promise<void>;
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
  const [state, setState] = useState<SessionState>({ session: null, sets: [], feedback: [], loading: true, allSessions: [] });

  const loadSets = useCallback(async (sessionId: string) => {
    const [sets, feedback] = await Promise.all([getSetsForSession(sessionId), getFeedbackForSession(sessionId)]);
    setState((s) => ({ ...s, sets, feedback }));
  }, []);

  useEffect(() => {
    (async () => {
      const [existing, allSessions] = await Promise.all([getActiveSession(), listSessions()]);
      if (existing) {
        const [sets, feedback] = await Promise.all([getSetsForSession(existing.id), getFeedbackForSession(existing.id)]);
        setState({ session: existing, sets, feedback, loading: false, allSessions });
      } else {
        setState({ session: null, sets: [], feedback: [], loading: false, allSessions });
      }
    })();
  }, []);

  const currentWeek = useMemo(() => computeCurrentWeek(state.allSessions), [state.allSessions]);

  const refreshSessions = useCallback(async () => {
    const allSessions = await listSessions();
    setState((s) => ({ ...s, allSessions }));
  }, []);

  // Solo se puede hacer la semana actual: las futuras se miran, no se hacen.
  const startSession = useCallback(async (day: Day): Promise<WorkoutSession> => {
    const plan = getWeekPlan(currentWeek);
    if (!plan) throw new Error(`La semana ${currentWeek} todavía no tiene pauta.`);
    const prescription = getPrescription(currentWeek, day);
    const session: WorkoutSession = {
      id: newId(),
      day,
      week: currentWeek,
      prescriptionVersion: plan.version,
      startedAt: new Date().toISOString(),
      status: "active",
      source: "manual",
      // El calentamiento no entra: es solo informativo, no se registra.
      exerciseOrder: prescription.filter((p) => !p.isWarmup).map((p) => p.exerciseId),
      skippedExerciseIds: [],
    };
    await saveSession(session);
    setState((s) => ({ session, sets: [], feedback: [], loading: false, allSessions: [session, ...s.allSessions] }));
    return session;
  }, [currentWeek]);

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
          videoSent: current?.videoSent ?? false,
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
      const allExercises = trainingOrder(prev.session);
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
      const allSessions = prev.allSessions.map((s) => (s.id === nextSession.id ? nextSession : s));
      return { ...prev, session: nextSession, allSessions };
    });
  }, []);

  const discardActiveSessionView = useCallback(() => {
    setState((s) => ({ session: null, sets: [], feedback: [], loading: false, allSessions: s.allSessions }));
  }, []);

  const api = useMemo<SessionApi>(
    () => ({
      ...state,
      currentWeek,
      refreshSessions,
      startSession,
      addSet,
      removeSet,
      setFeedback,
      toggleSkip,
      reorder,
      finishSession,
      discardActiveSessionView,
    }),
    [state, currentWeek, refreshSessions, startSession, addSet, removeSet, setFeedback, toggleSkip, reorder, finishSession, discardActiveSessionView]
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
