import { useNavigate } from "react-router-dom";
import { useSession } from "../state/SessionContext";
import { getExercise } from "../data/exercises";
import { getPrescription } from "../data/prescription";
// Nota: "Terminar" solo navega a Cierre. La sesión se marca complete/partial
// recién cuando San confirma el RPE ahí, no antes (ver CierreScreen).

const FLOOR_LABEL: Record<string, string> = {
  "-1": "Piso -1",
  "3": "Piso 3",
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

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    reorder(next);
  };

  const setsDone = (exerciseId: string) => sets.filter((s) => s.exerciseId === exerciseId).length;

  return (
    <div className="screen">
      <h1>Día {session.day}</h1>
      <p className="text-muted">Puedes reordenar, omitir o alternar sin perder lo ya registrado.</p>

      <ol className="exercise-list">
        {order.map((exerciseId, index) => {
          const exercise = getExercise(exerciseId);
          const presc = prescription.find((p) => p.exerciseId === exerciseId);
          const skipped = session.skippedExerciseIds.includes(exerciseId);
          const done = setsDone(exerciseId);
          if (!exercise || !presc) return null;

          return (
            <li key={exerciseId} className={`exercise-list__item${skipped ? " exercise-list__item--skipped" : ""}`}>
              <div className="exercise-list__reorder">
                <button aria-label="Mover arriba" onClick={() => move(index, -1)} disabled={index === 0}>
                  ▲
                </button>
                <button aria-label="Mover abajo" onClick={() => move(index, 1)} disabled={index === order.length - 1}>
                  ▼
                </button>
              </div>

              <button className="exercise-list__body" onClick={() => navigate(`/ejercicio/${exerciseId}`)}>
                <div className="exercise-list__main">
                  <span className="exercise-list__name">
                    {presc.isWarmup ? "🔸 " : ""}
                    {exercise.name}
                    {exercise.needsConfirmation && <span className="badge badge--warn" title={exercise.confirmationNote}> por confirmar</span>}
                  </span>
                  <span className="exercise-list__meta">
                    {exercise.floor && FLOOR_LABEL[exercise.floor]} · {presc.sets} series
                    {presc.repsText ? ` · ${presc.repsText}` : ""}
                  </span>
                </div>
                <div className="exercise-list__state">
                  {skipped ? (
                    <span className="badge badge--muted">Omitido</span>
                  ) : done > 0 ? (
                    <span className="badge badge--ok">{done}/{presc.sets} series</span>
                  ) : (
                    <span className="badge badge--pending">Sin registrar</span>
                  )}
                </div>
              </button>

              <button className="exercise-list__skip" onClick={() => toggleSkip(exerciseId)}>
                {skipped ? "Deshacer" : "Omitir"}
              </button>
            </li>
          );
        })}
      </ol>

      <button className="btn btn--primary btn--large" onClick={() => navigate("/cierre")}>
        Terminar y revisar sesión
      </button>
    </div>
  );
}
