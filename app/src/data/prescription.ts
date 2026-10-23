import type { Prescription } from "../types";

// Semana 2 de 5, leída de la pestaña M1 del Sheet el 23 de octubre de 2026
// (columnas H a N). La semana 1 venía de la importación del 15 de octubre.
// version identifica esta copia: cada sesión guarda con qué versión se hizo,
// así el historial de la semana 1 queda intacto al cambiar la pauta.
export const PRESCRIPTION_VERSION = "2026-10-23-semana-2";
export const PRESCRIPTION_WEEK = 2;
export const PRESCRIPTION_TOTAL_WEEKS = 5;

// El bloque E (los dos últimos de cada día) venía marcado como biserie en el
// prototipo anterior, pero la especificación pide no convertir eso en una
// obligación automática sin revisar la pauta real. Se mantiene como referencia
// heredada, visible pero no forzada: la app permite completar cada ejercicio
// del bloque de forma independiente.

export const PRESCRIPTION_DAY1: Prescription[] = [
  { id: "d1-1", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "rotation", order: 1, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
  { id: "d1-2", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "er", order: 2, block: "Calentamiento", sets: 2, repsText: "5 por lado", loadText: "2,5 kg", isWarmup: true },
  { id: "d1-3", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "hips", order: 3, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
  { id: "d1-4", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "legpress", order: 4, block: "A", sets: 4, repsText: "10", loadText: "20 / 30 / = / =", isWarmup: false, coachComments: ["Evaluemos si te sigue doliendo esta semana.", "Atrás del respaldo hay un cosito para acomodarlo: trata de bajarla 1 posición, para que así puedas bajar más y quizás más cómodamente."] },
  { id: "d1-5", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "row", order: 5, block: "B", sets: 3, repsText: "8 a 12 por lado", loadText: "6 a 7 kg", isWarmup: false, coachComments: ["Tranquila, lo acepto. Si hay de 6 kg, hacer 12; y si es de 7 kg, 10 a 15 reps, 3 series. ¡Pero muy bien!", "Trata de llevar la mancuerna hacia tu cadera, más que sólo hacia arriba.", "Carga: lo que haya disponible."] },
  { id: "d1-6", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "curl", order: 6, block: "C", sets: 3, repsText: "12 a 15", loadText: "25 kg", isWarmup: false },
  { id: "d1-7", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "press", order: 7, block: "D", sets: 3, repsText: "8", loadText: "14 kg", isWarmup: false, coachComments: ["¡Muy bien! Quizás te molesta porque no estás acostumbrada a ese tipo de empuje."] },
  { id: "d1-8", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "unknown", order: 8, block: "E", sets: 3, repsText: "10", loadText: "2,5 kg por lado, banco a 60°", isWarmup: false, coachComments: ["¡Muy bien!!! Baja un poquito más controlado para la próxima."] },
  { id: "d1-9", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "bear", order: 9, block: "E", sets: 3, repsText: "8 por lado", loadText: null, isWarmup: false, coachComments: ["¡Muy bien! Sólo tratar de no mover tanto la colita, activa bien el core."] },
];

export const PRESCRIPTION_DAY2: Prescription[] = [
  { id: "d2-1", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "rotation", order: 1, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
  { id: "d2-2", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "er", order: 2, block: "Calentamiento", sets: 2, repsText: "5 por lado", loadText: "2 kg", isWarmup: true },
  { id: "d2-3", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "hams", order: 3, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: null, isWarmup: true },
  { id: "d2-4", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "rdl", order: 4, block: "A", sets: 4, repsText: "8 a 10 por lado (tal como aparece en la pauta)", loadText: "20 / 30 kg / = / =", isWarmup: false },
  { id: "d2-5", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "incline", order: 5, block: "B", sets: 3, repsText: "10 a 12", loadText: "10 × 5 kg / 10 × 5 kg / 8 × 6 kg", isWarmup: false, coachNote: "Por serie: repeticiones × kilos." },
  { id: "d2-6", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "extension", order: 6, block: "C", sets: 3, repsText: "12", loadText: "20 kg", isWarmup: false },
  { id: "d2-7", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "pulldown", order: 7, block: "D", sets: 3, repsText: "10 a 12", loadText: "21 kg + 1 plaquita", isWarmup: false },
  { id: "d2-8", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "clamshell", order: 8, block: "E", sets: 3, repsText: "8 por lado", loadText: "Sin banda; consultar si hay bandas", isWarmup: false },
  { id: "d2-9", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "crunch", order: 9, block: "E", sets: 3, repsText: "10 a 15", loadText: "5 kg", isWarmup: false },
];

export function getPrescription(day: 1 | 2): Prescription[] {
  return day === 1 ? PRESCRIPTION_DAY1 : PRESCRIPTION_DAY2;
}
