import type { Exercise } from "../types";
import { applyOverride } from "../lib/exercise-overrides";

// Catálogo de los ejercicios de la rutina de San (Día 1 + Día 2).
// Piso confirmado: tren inferior en -1, tren superior en 3 (sección 2 de la especificación).
// needsConfirmation refleja las ambigüedades reales de la sección 10, no una suposición.
//
// floor: 'unknown' en los ejercicios de calentamiento/movilidad/core es a propósito,
// no un dato que falte. La especificación original (sección 2) pide explícitamente
// no asignarles piso automáticamente: "No asignar automáticamente todos los
// ejercicios de movilidad o core a un piso. Su ubicación debe ser editable."
//
// muscleGroup es informativo (tren superior/inferior/core), clasificado por el
// movimiento en sí; no determina ni reemplaza el piso.

export const EXERCISES: Exercise[] = [
  {
    id: "rotation",
    name: "Quadruped trunk rotation",
    originalName: "Quadruped trunk rotation",
    muscleGroup: "Core",
    floor: "unknown",
    equipment: "Sin carga",
    referenceUrl: "https://www.youtube.com/watch?v=QWwiOHexU8I",
    needsConfirmation: false,
  },
  {
    id: "er",
    name: "ER Knee supported",
    originalName: "ER Knee supported",
    muscleGroup: "Tren superior",
    floor: "unknown",
    equipment: "Mancuerna 2 kg",
    referenceUrl: "https://www.youtube.com/shorts/MFmh1mmCQC0",
    needsConfirmation: true,
    confirmationNote: "Sin repeticiones prescritas en la pauta. 6 por lado fue lo realizado, no la prescripción.",
  },
  {
    id: "hips",
    name: "90/90 Hip Mobility",
    originalName: "90/90 Hip Mobility",
    muscleGroup: "Tren inferior",
    floor: "unknown",
    equipment: "Sin carga",
    referenceUrl: "https://www.youtube.com/watch?v=D2ThOWxGbSI",
    needsConfirmation: false,
  },
  {
    id: "legpress",
    name: "Leg Press",
    originalName: "Leg Press",
    muscleGroup: "Tren inferior",
    floor: "-1",
    equipment: "Máquina",
    referenceUrl: "https://www.youtube.com/shorts/EotSw18oR9w",
    needsConfirmation: true,
    confirmationNote: "El catálogo local solo tiene 'Incline Leg Press'. Verificar si es la misma máquina antes de confiar en el video.",
  },
  {
    id: "row",
    name: "3 point row",
    originalName: "3 point row",
    muscleGroup: "Tren superior",
    floor: "3",
    equipment: "Mancuerna, con interrogante en 7 kg",
    referenceUrl: "https://www.youtube.com/watch?v=AgjwVQmycuQ",
    needsConfirmation: true,
    confirmationNote: "Sin match exacto en el catálogo. Se usa 'One Arm Dumbbell Row' como referencia cercana, marcada como aproximada.",
  },
  {
    id: "curl",
    name: "Leg Curl",
    originalName: "Leg Curl",
    muscleGroup: "Tren inferior",
    floor: "-1",
    equipment: "Máquina",
    referenceUrl: "https://www.youtube.com/watch?v=Th_m1_3upXo",
    needsConfirmation: true,
    confirmationNote: "Variante sentada o acostada sin confirmar (sección 10). Se usa 'Lying Leg Curls' por defecto; revisar antes de dar por buena.",
  },
  {
    id: "press",
    name: "Horizontal Press Machine",
    originalName: "Horizontal Press Machine",
    muscleGroup: "Tren superior",
    floor: "3",
    equipment: "Máquina, probar 2 placas",
    referenceUrl: "https://www.youtube.com/shorts/bdcKHTb-LGU",
    needsConfirmation: true,
    confirmationNote: "Sin match exacto. Se usa 'Chest Press-Machine' como referencia cercana, marcada como aproximada.",
  },
  {
    id: "unknown",
    name: "Hacer primer ejercicio",
    originalName: "Hacer primer ejercicio",
    // El banco a 60° + mancuerna sugiere tren superior (tipo press inclinado),
    // pero el ejercicio en sí sigue sin nombre identificado: no confiar del todo en esto.
    muscleGroup: "Tren superior (sin confirmar)",
    floor: "3",
    equipment: "Mancuerna 2 a 2,5 kg por lado, banco a 60°",
    referenceUrl: "https://www.youtube.com/shorts/lRTT2YABNIM",
    needsConfirmation: true,
    confirmationNote: "Ejercicio sin nombre identificado en la pauta original (sección 10). Mantener pendiente, no inventar un nombre.",
  },
  {
    id: "bear",
    name: "Bear Plank to Shoulder Taps",
    originalName: "Bear Plank to Shoulder taps",
    muscleGroup: "Core",
    floor: "unknown",
    equipment: "Peso corporal",
    referenceUrl: "https://www.youtube.com/shorts/bdcKHTb-LGU",
    needsConfirmation: true,
    confirmationNote: "Comparte enlace de YouTube con Horizontal Press Machine en la pauta original; ese enlace no es una referencia válida para los dos ejercicios (sección 10).",
  },
  {
    id: "hams",
    name: "90/90 Hams Stretch",
    originalName: "90/90 Hams Stretch",
    muscleGroup: "Tren inferior",
    floor: "unknown",
    equipment: "Sin carga",
    referenceUrl: "https://www.youtube.com/shorts/GNEfNkFuoWU",
    needsConfirmation: true,
    confirmationNote: "Variante sin confirmar (sección 10).",
  },
  {
    id: "rdl",
    name: "BB RDL",
    originalName: "BB RDL",
    muscleGroup: "Tren inferior",
    floor: "-1",
    equipment: "Barra",
    referenceUrl: "https://www.youtube.com/watch?v=2G6m2hWvMWM",
    needsConfirmation: true,
    confirmationNote: "La pauta anota 'por lado', lo que no es habitual para un RDL con barra; no se corrigió la fuente silenciosamente (sección 10). Se usa 'Romanian Deadlift' del catálogo como referencia cercana.",
  },
  {
    id: "incline",
    name: "Inclined Bench Press",
    originalName: "Inclined Bench Press",
    muscleGroup: "Tren superior",
    floor: "3",
    equipment: "Mancuerna 5 a 6 kg por lado, con interrogante",
    referenceUrl: "https://www.youtube.com/watch?v=Fv5EYoJfRt4",
    needsConfirmation: false,
  },
  {
    id: "extension",
    name: "Leg Extension",
    originalName: "Leg Extension",
    muscleGroup: "Tren inferior",
    floor: "-1",
    equipment: "Máquina, probar 15 a 20 kg",
    referenceUrl: "https://www.youtube.com/shorts/uM86QE59Tgc",
    needsConfirmation: false,
  },
  {
    id: "pulldown",
    name: "Pulldown machine",
    originalName: "Pulldown machine",
    muscleGroup: "Tren superior",
    floor: "3",
    equipment: "Máquina, probar 15 a 20 kg",
    referenceUrl: "https://www.youtube.com/shorts/3q1Zsi3vkjo",
    needsConfirmation: true,
    confirmationNote: "Sin match exacto; se usa 'Lat Pulldowns' como referencia cercana, marcada como aproximada.",
  },
  {
    id: "clamshell",
    name: "Clamshell",
    originalName: "Clamshell",
    muscleGroup: "Tren inferior",
    floor: "unknown",
    equipment: "Sin banda; consultar disponibilidad",
    referenceUrl: "https://www.youtube.com/shorts/us39nzaFu9Q",
    needsConfirmation: false,
  },
  {
    id: "crunch",
    name: "Vertical crunch",
    originalName: "Vertical crunch",
    muscleGroup: "Core",
    floor: "unknown",
    equipment: "5 kg",
    referenceUrl: "https://www.youtube.com/shorts/dTJhFFyLBOU",
    needsConfirmation: true,
    confirmationNote: "Variante sin confirmar (sección 10). Se usa 'High Pulley Crunches' como referencia cercana.",
  },
];

export function getExercise(id: string): Exercise | undefined {
  const base = EXERCISES.find((e) => e.id === id);
  return base ? applyOverride(base) : undefined;
}

export function getAllExercises(): Exercise[] {
  return EXERCISES.map(applyOverride);
}
