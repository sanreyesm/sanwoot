import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../state/SessionContext";
import { getExercise } from "../data/exercises";
import { getPrescription } from "../data/prescription";

export function CierreScreen() {
  const { session, sets, finishSession, discardActiveSessionView } = useSession();
  const navigate = useNavigate();
  const [rpe, setRpe] = useState(session?.rpe ?? 5);
  const [note, setNote] = useState(session?.sessionNote ?? "");
  const [saved, setSaved] = useState(false);

  if (!session) {
    return (
      <div className="screen">
        <p>No hay una sesión para cerrar.</p>
        <button className="btn btn--primary" onClick={() => navigate("/")}>Ir a Hoy</button>
      </div>
    );
  }

  const prescription = getPrescription(session.day);
  const doneExercises = new Set(sets.map((s) => s.exerciseId));

  const complete = prescription.filter((p) => doneExercises.has(p.exerciseId) && !session.skippedExerciseIds.includes(p.exerciseId));
  const partial = prescription.filter((p) => doneExercises.has(p.exerciseId) === false && !session.skippedExerciseIds.includes(p.exerciseId));
  const skipped = prescription.filter((p) => session.skippedExerciseIds.includes(p.exerciseId));

  const onSave = async () => {
    await finishSession(rpe, note);
    setSaved(true);
  };

  if (saved) {
    return (
      <div className="screen">
        <h1>Sesión guardada</h1>
        <p>
          {partial.length === 0 && skipped.length === 0
            ? "Quedó registrada como completa."
            : "Quedó registrada como parcial: puedes retomarla desde Historial o seguir sumando registros si vuelves a abrir la rutina."}
        </p>
        <button
          className="btn btn--primary btn--large"
          onClick={() => {
            discardActiveSessionView();
            navigate("/");
          }}
        >
          Ir a Hoy
        </button>
        <button className="btn btn--outline" onClick={() => navigate("/historial")}>
          Ver historial
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <h1>Cierre — Día {session.day}</h1>

      <div className="card">
        <p className="card__title">Completos ({complete.length})</p>
        {complete.map((p) => <p key={p.id}>✅ {getExercise(p.exerciseId)?.name}</p>)}
      </div>

      {partial.length > 0 && (
        <div className="card">
          <p className="card__title">Sin registrar ({partial.length})</p>
          {partial.map((p) => <p key={p.id}>⬜ {getExercise(p.exerciseId)?.name}</p>)}
        </div>
      )}

      {skipped.length > 0 && (
        <div className="card">
          <p className="card__title">Omitidos ({skipped.length})</p>
          {skipped.map((p) => <p key={p.id}>➖ {getExercise(p.exerciseId)?.name}</p>)}
        </div>
      )}

      <div className="card">
        <label>
          RPE de la sesión (0 = nada de esfuerzo, 10 = máximo esfuerzo)
          <input
            type="range"
            min={0}
            max={10}
            value={rpe}
            onChange={(e) => setRpe(Number(e.target.value))}
          />
          <span className="rpe-value">{rpe}</span>
        </label>
        <label>
          Comentario de fin de sesión
          <textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>

      <button className="btn btn--primary btn--large" onClick={onSave}>
        Guardar sesión
      </button>
    </div>
  );
}
