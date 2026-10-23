import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExercise } from "../data/exercises";
import { getPrescription } from "../data/prescription";
import { resolveDemo } from "../data/demo-map";
import { DemoPlayer } from "../components/DemoPlayer";
import { DemoPicker } from "../components/DemoPicker";
import { Icon } from "../components/Icon";
import { CoachComments } from "../components/CoachComments";
import { getLastSetsForExercise } from "../lib/db";
import { setOverride } from "../lib/exercise-overrides";
import { MUSCLE_GROUPS, FLOORS, floorLabel } from "../data/exercise-options";
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
  const [editingNote, setEditingNote] = useState(false);
  const [draftNote, setDraftNote] = useState("");
  const [exercise, setExerciseState] = useState<Exercise | undefined>(() => getExercise(exerciseId));
  const [demoVersion, setDemoVersion] = useState(0); // fuerza releer resolveDemo() tras elegir video

  useEffect(() => {
    getLastSetsForExercise(exerciseId).then(setLastSets);
    const ex = getExercise(exerciseId);
    setExerciseState(ex);
    setMyNote(ex?.myNote ?? "");
    setEditingNote(false);
  }, [exerciseId]);

  const prescription = getPrescription(day).find((p) => p.exerciseId === exerciseId);
  const order = getPrescription(day).map((p) => p.exerciseId);
  const currentIndex = order.indexOf(exerciseId);
  const prevId = currentIndex > 0 ? order[currentIndex - 1] : null;
  const nextId = currentIndex < order.length - 1 ? order[currentIndex + 1] : null;

  if (!exercise || !prescription) {
    return <p className="screen">Ejercicio no encontrado en la pauta de este día.</p>;
  }

  // Se recalcula en cada render; demoVersion solo fuerza que haya un render
  // nuevo justo después de que DemoPicker guarde una elección.
  const demo = resolveDemo(exerciseId);

  const startEditingNote = () => {
    setDraftNote(myNote);
    setEditingNote(true);
  };

  const saveNote = () => {
    setMyNote(draftNote);
    setOverride(exerciseId, { myNote: draftNote });
    setEditingNote(false);
  };

  const editExercise = (patch: { muscleGroup?: string; floor?: Exercise["floor"] }) => {
    setOverride(exerciseId, patch);
    setExerciseState(getExercise(exerciseId));
  };

  return (
    <div className="screen">
      <div className="exercise-nav">
        <button className="exercise-nav__back" onClick={() => navigate(`/dia/${day}`)}>
          <Icon name="chevron-left" size={19} strokeWidth={2.6} />
          Día {day}
        </button>
        <div className="exercise-nav__pager">
          <button className="icon-btn" aria-label="Ejercicio anterior" disabled={!prevId} onClick={() => prevId && navigate(`/dia/${day}/ejercicio/${prevId}`)}>
            <Icon name="chevron-left" size={18} strokeWidth={2.6} />
          </button>
          <span className="exercise-nav__count">{currentIndex + 1} de {order.length}</span>
          <button className="icon-btn" aria-label="Ejercicio siguiente" disabled={!nextId} onClick={() => nextId && navigate(`/dia/${day}/ejercicio/${nextId}`)}>
            <Icon name="chevron-right" size={18} strokeWidth={2.6} />
          </button>
        </div>
      </div>

      <div className="eyebrow">Vista informativa · {exercise.muscleGroup ? `${exercise.muscleGroup} · ` : ""}{floorLabel(exercise.floor)}</div>
      <h1 style={{ fontSize: 27 }}>{exercise.name}</h1>

      <DemoPlayer
        key={demoVersion}
        file={demo.file}
        confidence={demo.confidence}
        note={demo.note}
        referenceUrl={exercise.referenceUrl}
        youtubeUrl={demo.youtubeUrl}
        chosenByUser={demo.chosenByUser}
      />
      <DemoPicker exerciseId={exerciseId} active={!!demo.chosenByUser} onChange={() => setDemoVersion((v) => v + 1)} />

      {exercise.needsConfirmation && (
        <div role="note" className="banner banner--warn">
          <Icon name="warning" size={19} strokeWidth={2.4} />
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
        <div style={{ fontSize: 13, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
          <span className="text-muted">Equipo</span> <strong>{exercise.equipment}</strong>
        </div>
        <CoachComments prescription={prescription} />
      </section>

      {lastSets.length > 0 && (
        <section className="card card--muted">
          <p className="card__title">
            <Icon name="history" size={13} strokeWidth={2.4} /> La vez anterior
          </p>
          <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {lastSets.map((s) => `${s.reps ?? "–"} × ${s.weightKg ?? "–"}kg`).join(" · ")}
          </div>
        </section>
      )}

      <div className="set-input__field">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label htmlFor="my-note-preview" style={{ margin: 0 }}>
            <Icon name="device" size={11} strokeWidth={2.4} /> Tu nota privada (solo para ti, nunca se le envía a tu entrenadora)
          </label>
          {!editingNote && (
            <button className="icon-btn" aria-label="Editar tu nota" onClick={startEditingNote} style={{ width: 29, height: 29 }}>
              ✏️
            </button>
          )}
        </div>
        <textarea
          id="my-note-preview"
          rows={2}
          placeholder='Ej. "es con mancuerna", "en COROS es el parecido a este pero con plancha normal"'
          value={editingNote ? draftNote : myNote}
          disabled={!editingNote}
          onChange={(e) => setDraftNote(e.target.value)}
          style={editingNote ? undefined : { background: "var(--screen-bg)", color: "var(--muted)" }}
        />
        {editingNote && (
          <div className="camera-actions">
            <button className="btn btn--primary" onClick={saveNote}>Guardar</button>
            <button className="btn btn--outline" onClick={() => setEditingNote(false)}>Cancelar</button>
          </div>
        )}
      </div>

      <section className="card">
        <p className="card__title">Ajustar este ejercicio</p>
        <p className="text-muted">Se guarda en este teléfono y se aplica en toda la app.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
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
