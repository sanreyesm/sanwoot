import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../state/SessionContext";
import { getExercise } from "../data/exercises";
import { getPrescription } from "../data/prescription";
import { Icon } from "../components/Icon";
import { Badge } from "../components/Badge";

const RPE_LABELS: Record<number, string> = {
  0: "Nada de esfuerzo",
  1: "Muy, muy liviano",
  2: "Muy liviano",
  3: "Liviano",
  4: "Algo duro",
  5: "Duro",
  6: "Duro",
  7: "Duro, con margen",
  8: "Muy duro",
  9: "Casi máximo",
  10: "Máximo esfuerzo",
};

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
  const partial = prescription.filter((p) => !doneExercises.has(p.exerciseId) && !session.skippedExerciseIds.includes(p.exerciseId));
  const skipped = prescription.filter((p) => session.skippedExerciseIds.includes(p.exerciseId));

  const onSave = async () => {
    await finishSession(rpe, note);
    setSaved(true);
  };

  if (saved) {
    const isComplete = partial.length === 0 && skipped.length === 0;
    return (
      <div className="screen">
        <h1>Sesión guardada</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge variant={isComplete ? "complete" : "partial"}>{isComplete ? "Completa" : "Parcial"}</Badge>
          {!isComplete && <span className="text-muted">Quedan {partial.length} ejercicio(s) sin registrar.</span>}
        </div>
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
      <button className="exercise-nav__back" onClick={() => navigate("/rutina")}>
        <Icon name="chevron-left" size={24} strokeWidth={2.6} />
        Rutina
      </button>
      <div className="eyebrow">Día {session.day}</div>
      <h1>Cierre</h1>

      <section className="card">
        <p className="card__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge variant="complete">Completos</Badge>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22 }}>{complete.length}</span>
        </p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {complete.map((p) => (
            <li key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 17 }}>
              <span style={{ fontWeight: 700 }}>{getExercise(p.exerciseId)?.name}</span>
            </li>
          ))}
        </ul>
      </section>

      {partial.length > 0 && (
        <section className="card" style={{ border: "2px solid var(--warn-bg)", boxShadow: "none" }}>
          <p className="card__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="unregistered">Sin registrar</Badge>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22 }}>{partial.length}</span>
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {partial.map((p) => (
              <li key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 17, fontWeight: 700 }}>
                {getExercise(p.exerciseId)?.name}
              </li>
            ))}
          </ul>
          <button className="link-btn" style={{ alignSelf: "flex-start", padding: 0 }} onClick={() => navigate("/rutina")}>
            Volver a registrarlos
          </button>
        </section>
      )}

      {skipped.length > 0 && (
        <section className="card card--muted">
          <p className="card__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="skipped">Omitidos</Badge>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22 }}>{skipped.length}</span>
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {skipped.map((p) => (
              <li key={p.id} style={{ padding: "8px 0", fontSize: 17, fontWeight: 700 }}>{getExercise(p.exerciseId)?.name}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <p className="card__title"><label htmlFor="rpe-range">Esfuerzo de la sesión (RPE)</label></p>
        <div className="stepper">
          <div className="stepper__value">
            <span className="stepper__number stepper__number--accent">{rpe}</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="stepper__unit">de 10</span>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{RPE_LABELS[rpe]}</span>
            </span>
          </div>
          <div className="stepper__row">
            <button className="stepper__btn" aria-label={`Bajar RPE a ${Math.max(0, rpe - 1)}`} onClick={() => setRpe(Math.max(0, rpe - 1))}>−</button>
            <input
              id="rpe-range"
              type="range"
              min={0}
              max={10}
              step={1}
              value={rpe}
              aria-valuetext={`${rpe} de 10, ${RPE_LABELS[rpe]}`}
              onChange={(e) => setRpe(Number(e.target.value))}
            />
            <button className="stepper__btn" aria-label={`Subir RPE a ${Math.min(10, rpe + 1)}`} onClick={() => setRpe(Math.min(10, rpe + 1))}>+</button>
          </div>
        </div>
      </section>

      <div className="set-input__field">
        <label htmlFor="cierre-comment">Comentario de cierre (opcional)</label>
        <textarea id="cierre-comment" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <button className="btn btn--primary btn--large" onClick={onSave}>
        {partial.length === 0 && skipped.length === 0 ? "Guardar como completa" : "Guardar como parcial"}
      </button>
      <p className="text-muted" style={{ textAlign: "center" }}>Se guarda en este teléfono. La puedes exportar desde Historial.</p>
    </div>
  );
}
