import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExercise } from "../data/exercises";
import { getPrescription } from "../data/prescription";
import { resolveDemoFile } from "../data/demo-map";
import { DemoPlayer } from "../components/DemoPlayer";
import { Icon } from "../components/Icon";
import { getLastSetsForExercise } from "../lib/db";
import { setOverride } from "../lib/exercise-overrides";
import { MUSCLE_GROUPS, FLOORS } from "../data/exercise-options";
import type { Day, Exercise, SetResult } from "../types";

// Nivel 3 en modo informativo: mirar el ejercicio, dejar tu nota privada y
// ajustar tren superior/inferior/piso. Nada acá va para la entrenadora —
// no hay registro de series, RIR ni comentario para ella, porque todavía
// no estás haciendo el ejercicio. Eso vive en EjercicioScreen (modo activo).
export function EjercicioPreviewScreen() {
  const { day: dayParam, exerciseId = "" } = useParams();
  const day = Number(dayParam) as Day;
  const navigate = useNavigate();

  const [lastSets, setLastSets] = useState<SetResult[]>([]);
  const [myNote, setMyNote] = useState("");
  const [exercise, setExerciseState] = useState<Exercise | undefined>(() => getExercise(exerciseId));

  useEffect(() => {
    getLastSetsForExercise(exerciseId).then(setLastSets);
    const ex = getExercise(exerciseId);
    setExerciseState(ex);
    setMyNote(ex?.myNote ?? "");
  }, [exerciseId]);

  const prescription = getPrescription(day).find((p) => p.exerciseId === exerciseId);
  const order = getPrescription(day).map((p) => p.exerciseId);
  const currentIndex = order.indexOf(exerciseId);
  const prevId = currentIndex > 0 ? order[currentIndex - 1] : null;
  const nextId = currentIndex < order.length - 1 ? order[currentIndex + 1] : null;

  if (!exercise || !prescription) {
    return <p className="screen">Ejercicio no encontrado en la pauta de este día.</p>;
  }

  const demo = resolveDemoFile(exerciseId);

  const saveMyNote = (value: string) => {
    setMyNote(value);
    setOverride(exerciseId, { myNote: value });
  };

  const editExercise = (patch: { muscleGroup?: string; floor?: Exercise["floor"] }) => {
    setOverride(exerciseId, patch);
    setExerciseState(getExercise(exerciseId));
  };

  return (
    <div className="screen">
      <div className="exercise-nav">
        <button className="exercise-nav__back" onClick={() => navigate(`/dia/${day}`)}>
          <Icon name="chevron-left" size={24} strokeWidth={2.6} />
          Día {day}
        </button>
        <div className="exercise-nav__pager">
          <button className="icon-btn" aria-label="Ejercicio anterior" disabled={!prevId} onClick={() => prevId && navigate(`/dia/${day}/ejercicio/${prevId}`)}>
            <Icon name="chevron-left" size={22} strokeWidth={2.6} />
          </button>
          <span className="exercise-nav__count">{currentIndex + 1} de {order.length}</span>
          <button className="icon-btn" aria-label="Ejercicio siguiente" disabled={!nextId} onClick={() => nextId && navigate(`/dia/${day}/ejercicio/${nextId}`)}>
            <Icon name="chevron-right" size={22} strokeWidth={2.6} />
          </button>
        </div>
      </div>

      <div className="eyebrow">Vista informativa · {exercise.muscleGroup ? `${exercise.muscleGroup} · ` : ""}{exercise.floor && (exercise.floor === "unknown" ? "Piso por confirmar" : `Piso ${exercise.floor}`)}</div>
      <h1 style={{ fontSize: 34 }}>{exercise.name}</h1>

      <DemoPlayer file={demo.file} confidence={demo.confidence} note={demo.note} referenceUrl={exercise.referenceUrl} />

      {exercise.needsConfirmation && (
        <div role="note" className="banner banner--warn">
          <Icon name="warning" size={24} strokeWidth={2.4} />
          <div>
            <div className="banner__title">Por confirmar con el coach</div>
            <div>{exercise.confirmationNote}</div>
          </div>
        </div>
      )}

      <section className="card">
        <p className="card__title">Pauta del coach</p>
        <dl className="stat-grid">
          <div>
            <dt>Series</dt>
            <dd>{prescription.sets}</dd>
          </div>
          <div>
            <dt>Reps</dt>
            <dd style={{ fontSize: prescription.repsText && prescription.repsText.length > 8 ? 20 : 32 }}>{prescription.repsText ?? "–"}</dd>
          </div>
          <div>
            <dt>Carga</dt>
            <dd style={{ fontSize: prescription.loadText && prescription.loadText.length > 8 ? 18 : 32 }}>{prescription.loadText ?? "–"}</dd>
          </div>
        </dl>
        <div style={{ fontSize: 16, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
          <span className="text-muted">Equipo</span> <strong>{exercise.equipment}</strong>
        </div>
      </section>

      {lastSets.length > 0 && (
        <section className="card card--muted">
          <p className="card__title">
            <Icon name="history" size={16} strokeWidth={2.4} /> La vez anterior
          </p>
          <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {lastSets.map((s) => `${s.reps ?? "–"} × ${s.weightKg ?? "–"}kg`).join(" · ")}
          </div>
        </section>
      )}

      <div className="set-input__field">
        <label htmlFor="my-note-preview">
          <Icon name="device" size={14} strokeWidth={2.4} /> Tu nota privada (solo para ti, nunca se le envía a tu entrenadora)
        </label>
        <textarea
          id="my-note-preview"
          rows={2}
          placeholder='Ej. "es con mancuerna", "en COROS es el parecido a este pero con plancha normal"'
          value={myNote}
          onChange={(e) => saveMyNote(e.target.value)}
        />
      </div>

      <section className="card">
        <p className="card__title">Ajustar este ejercicio</p>
        <p className="text-muted">Se guarda en este teléfono y se aplica en toda la app.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select className="select" value={exercise.muscleGroup ?? ""} onChange={(e) => editExercise({ muscleGroup: e.target.value })}>
            <option value="">Sin clasificar</option>
            {MUSCLE_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select className="select" value={exercise.floor ?? "unknown"} onChange={(e) => editExercise({ floor: e.target.value as Exercise["floor"] })}>
            {FLOORS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </section>
    </div>
  );
}
