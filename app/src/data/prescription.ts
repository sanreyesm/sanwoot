import type { Prescription } from "../types";

// Prescripción importada el 15 de octubre de 2026 (sección 9 de la especificación).
// version identifica esta copia para poder migrar sin perder historial cuando
// se conecte la lectura real de Sheets.
export const PRESCRIPTION_VERSION = "2026-10-15-import";

// El bloque E (los dos últimos de cada día) venía marcado como biserie en el
// prototipo anterior, pero la especificación pide no convertir eso en una
// obligación automática sin revisar la pauta real. Se mantiene como referencia
// heredada, visible pero no forzada: la app permite completar cada ejercicio
// del bloque de forma independiente.

export const PRESCRIPTION_DAY1: Prescription[] = [
  { id: "d1-1", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "rotation", order: 1, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
  { id: "d1-2", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "er", order: 2, block: "Calentamiento", sets: 2, repsText: null, loadText: "2 kg", isWarmup: true, coachNote: "Repeticiones no indicadas en la pauta." },
  { id: "d1-3", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "hips", order: 3, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
  { id: "d1-4", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "legpress", order: 4, block: "A", sets: 4, repsText: "10 a 12", loadText: "20 / 30 / = / =", isWarmup: false },
  { id: "d1-5", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "row", order: 5, block: "B", sets: 3, repsText: "8 a 12 por lado", loadText: "7 kg (con interrogante)", isWarmup: false },
  { id: "d1-6", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "curl", order: 6, block: "C", sets: 3, repsText: "10 a 12", loadText: "Probar 25 a 30 kg", isWarmup: false },
  { id: "d1-7", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "press", order: 7, block: "D", sets: 3, repsText: "10 a 12", loadText: "Probar 2 placas", isWarmup: false },
  { id: "d1-8", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "unknown", order: 8, block: "E", sets: 3, repsText: "10 a 12", loadText: "2 a 2,5 kg por lado, banco a 60°", isWarmup: false },
  { id: "d1-9", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "bear", order: 9, block: "E", sets: 3, repsText: "8 a 10 por lado", loadText: null, isWarmup: false },
];

export const PRESCRIPTION_DAY2: Prescription[] = [
  { id: "d2-1", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "rotation", order: 1, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
  { id: "d2-2", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "er", order: 2, block: "Calentamiento", sets: 2, repsText: null, loadText: "2 kg", isWarmup: true, coachNote: "Repeticiones no indicadas en la pauta." },
  { id: "d2-3", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "hams", order: 3, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
  { id: "d2-4", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "rdl", order: 4, block: "A", sets: 4, repsText: "8 a 10 por lado (tal como aparece en la pauta)", loadText: "20 / 30 kg / = / =", isWarmup: false },
  { id: "d2-5", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "incline", order: 5, block: "B", sets: 3, repsText: "10 a 12", loadText: "5 a 6 kg por lado (con interrogante)", isWarmup: false },
  { id: "d2-6", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "extension", order: 6, block: "C", sets: 3, repsText: "10 a 12", loadText: "Probar 15 a 20 kg", isWarmup: false },
  { id: "d2-7", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "pulldown", order: 7, block: "D", sets: 3, repsText: "10 a 12", loadText: "Probar 15 a 20 kg", isWarmup: false },
  { id: "d2-8", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "clamshell", order: 8, block: "E", sets: 3, repsText: "8 a 10 por lado", loadText: "Sin banda; consultar disponibilidad", isWarmup: false },
  { id: "d2-9", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "crunch", order: 9, block: "E", sets: 3, repsText: "10 a 15", loadText: "5 kg", isWarmup: false },
];

export function getPrescription(day: 1 | 2): Prescription[] {
  return day === 1 ? PRESCRIPTION_DAY1 : PRESCRIPTION_DAY2;
}
