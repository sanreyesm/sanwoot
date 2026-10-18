import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "../state/SessionContext";
import { getExercise } from "../data/exercises";
import { getPrescription } from "../data/prescription";
import { Icon } from "../components/Icon";
import { Badge } from "../components/Badge";
import type { Day } from "../types";

const FLOOR_LABEL: Record<string, string> = {
  "-1": "Piso -1",
  "3": "Piso 3",
  any: "Cualquier piso",
  unknown: "Piso por confirmar",
};

// Nivel 2: solo mirar la rutina del día, sin sesión activa todavía.
// No hay registro, RIR, omitir ni comentario para la entrenadora acá —
// eso recién se habilita al tocar "Hacer rutina", que es lo único que
// de verdad empieza la sesión (ver EjercicioScreen para el modo activo).
export function DiaPreviewScreen() {
  const { day: dayParam } = useParams();
  const day = Number(dayParam) as Day;
  const navigate = useNavigate();
  const { startSession } = useSession();

  const prescription = getPrescription(day);
  if (day !== 1 && day !== 2) {
    return <p className="screen">Día no válido.</p>;
  }

  const totalSets = prescription.reduce((sum, p) => sum + p.sets, 0);

  const onStart = async () => {
    await startSession(day);
    navigate("/rutina");
  };

  const groups: { isWarmup: boolean; items: typeof prescription }[] = [];
  for (const p of prescription) {
    const last = groups[groups.length - 1];
    if (last && last.isWarmup === p.isWarmup) last.items.push(p);
    else groups.push({ isWarmup: p.isWarmup, items: [p] });
  }

  return (
    <div className="screen" style={{ paddingBottom: 100 }}>
      <button className="exercise-nav__back" onClick={() => navigate("/")}>
        <Icon name="chevron-left" size={24} strokeWidth={2.6} />
        Hoy
      </button>
      <div className="eyebrow">Vista informativa · no inicia registro</div>
      <h1>Día {day}</h1>
      <p className="text-muted">{prescription.length} ejercicios · {totalSets} series. Toca uno para ver su detalle.</p>

      {groups.map((group, gi) => (
        <div key={gi} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 className="eyebrow" style={{ margin: "4px 0 0" }}>
            {group.isWarmup ? "🔸 Calentamiento" : "Entrenamiento principal"}
          </h2>
          <ol className="exercise-list">
            {group.items.map((p) => {
              const exercise = getExercise(p.exerciseId);
              if (!exercise) return null;
              return (
                <li key={p.exerciseId} className="exercise-list__item">
                  <button className="exercise-list__top" onClick={() => navigate(`/dia/${day}/ejercicio/${p.exerciseId}`)}>
                    <span className="exercise-list__main">
                      <span className="exercise-list__name">{exercise.name}</span>
                      <span className="exercise-list__meta">
                        {exercise.muscleGroup && <Badge variant="device">{exercise.muscleGroup}</Badge>}
                        {exercise.floor && FLOOR_LABEL[exercise.floor]} · {p.sets} series
                        {p.repsText ? ` · ${p.repsText}` : ""}
                      </span>
                    </span>
                    <Icon name="chevron-right" size={22} strokeWidth={2.4} />
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      ))}

      <div className="fixed-action-bar">
        <button className="btn btn--primary btn--large" onClick={onStart}>
          Hacer rutina
          <Icon name="arrow-right" size={22} strokeWidth={2.8} />
        </button>
      </div>
    </div>
  );
}
