import { useNavigate } from "react-router-dom";
import { useSession } from "../state/SessionContext";
import { getExercise } from "../data/exercises";
import { getPrescription } from "../data/prescription";
import { Icon } from "../components/Icon";
import { Badge } from "../components/Badge";
import type { Exercise, Prescription } from "../types";

const FLOOR_LABEL: Record<string, string> = {
  "-1": "Piso -1",
  "3": "Piso 3",
  any: "Cualquier piso",
  unknown: "Piso por confirmar",
};

export function RutinaScreen() {
  const { session, sets, reorder, toggleSkip } = useSession();
  const navigate = useNavigate();

  if (!session) {
    return (
      <div className="screen">
        <p>No hay una sesión activa.</p>
        <button className="btn btn--primary" onClick={() => navigate("/")}>
          Ir a Hoy
        </button>
      </div>
    );
  }

  const prescription = getPrescription(session.day);
  const order = session.exerciseOrder;
  const setsDone = (exerciseId: string) => sets.filter((s) => s.exerciseId === exerciseId).length;
  const doneExercises = new Set(sets.map((s) => s.exerciseId));
  const currentId = order.find((id) => !doneExercises.has(id) && !session.skippedExerciseIds.includes(id));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    reorder(next);
  };

  // Agrupa por tramos consecutivos de calentamiento vs. entrenamiento principal,
  // según el orden actual (que puede haberse reordenado). Cada tramo lleva su
  // propio encabezado, pero el número de cada ejercicio sigue siendo su
  // posición real en la sesión, no un reinicio por sección.
  type Row = { index: number; exerciseId: string; exercise: Exercise; presc: Prescription };
  const rows: Row[] = order
    .map((exerciseId, index) => {
      const exercise = getExercise(exerciseId);
      const presc = prescription.find((p) => p.exerciseId === exerciseId);
      if (!exercise || !presc) return null;
      return { index, exerciseId, exercise, presc };
    })
    .filter((r): r is Row => r !== null);

  const groups: { isWarmup: boolean; rows: Row[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.isWarmup === row.presc.isWarmup) {
      last.rows.push(row);
    } else {
      groups.push({ isWarmup: row.presc.isWarmup, rows: [row] });
    }
  }

  const renderRow = ({ index, exerciseId, exercise, presc }: Row) => {
    const skipped = session.skippedExerciseIds.includes(exerciseId);
    const done = setsDone(exerciseId);
    const isCurrent = exerciseId === currentId;

    return (
      <li
        key={exerciseId}
        className={`exercise-list__item${skipped ? " exercise-list__item--skipped" : ""}${isCurrent ? " exercise-list__item--current" : ""}`}
      >
        <button className="exercise-list__top" onClick={() => navigate(`/ejercicio/${exerciseId}`)}>
          <span className="exercise-list__index">{index + 1}</span>
          <span className="exercise-list__main">
            {isCurrent && <span className="exercise-list__eyebrow">Ibas aquí</span>}
            <span className="exercise-list__name">{exercise.name}</span>
            <span className="exercise-list__meta">
              {exercise.muscleGroup && <Badge variant="device">{exercise.muscleGroup}</Badge>}
              {exercise.floor && FLOOR_LABEL[exercise.floor]} · {presc.sets} series
              {presc.repsText ? ` · ${presc.repsText}` : ""}
            </span>
          </span>
          <Icon name="chevron-right" size={18} strokeWidth={2.4} />
        </button>

        <div className="exercise-list__bottom">
          {skipped ? (
            <Badge variant="skipped">Omitido</Badge>
          ) : done > 0 ? (
            <Badge variant="complete">{done} de {presc.sets} series</Badge>
          ) : (
            <Badge variant="unregistered">Sin registrar</Badge>
          )}
          <div className="exercise-list__reorder">
            <button
              className="icon-btn"
              aria-label={index === 0 ? `Subir ${exercise.name}. Ya está primera` : `Subir ${exercise.name} a la posición ${index}`}
              onClick={() => move(index, -1)}
              disabled={index === 0}
            >
              <Icon name="arrow-up" size={16} strokeWidth={2.6} />
            </button>
            <button
              className="icon-btn"
              aria-label={index === order.length - 1 ? `Bajar ${exercise.name}. Ya está última` : `Bajar ${exercise.name} a la posición ${index + 2}`}
              onClick={() => move(index, 1)}
              disabled={index === order.length - 1}
            >
              <Icon name="arrow-down" size={16} strokeWidth={2.6} />
            </button>
          </div>
        </div>

        <button className="btn btn--neutral" onClick={() => toggleSkip(exerciseId)}>
          {skipped ? <Icon name="undo" size={13} /> : <Icon name="skip" size={13} />}
          {skipped ? "Recuperar" : "Omitir"}
        </button>
      </li>
    );
  };

  return (
    <div className="screen">
      <button className="exercise-nav__back" onClick={() => navigate("/")}>
        <Icon name="chevron-left" size={19} strokeWidth={2.6} />
        Hoy
      </button>
      <div className="eyebrow">Día {session.day} · {order.length} ejercicios</div>
      <h1>Rutina</h1>
      <p className="text-muted">Toca un ejercicio para abrirlo. Usa las flechas para cambiar el orden de hoy.</p>

      {groups.map((group, gi) => (
        <div key={gi} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 className="eyebrow" style={{ margin: "3px 0 0" }}>
            {group.isWarmup ? "🔸 Calentamiento" : "Entrenamiento principal"}
          </h2>
          <ol className="exercise-list">{group.rows.map(renderRow)}</ol>
        </div>
      ))}

      <button className="btn btn--primary btn--large" onClick={() => navigate("/cierre")}>
        Terminar y revisar
        <Icon name="arrow-right" size={18} strokeWidth={2.8} />
      </button>
    </div>
  );
}
