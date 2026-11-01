import type { Day, Prescription } from "../types";

// Semana 3 de 5, leída de la pestaña M1 del Sheet el 1 de noviembre de 2026
// (columnas O a U). La semana 2 venía de la lectura del 23 de octubre.
// version identifica esta copia: cada sesión guarda con qué versión se hizo,
// así el historial de semanas anteriores queda intacto al cambiar la pauta.
export const PRESCRIPTION_VERSION = "2026-11-01-semana-3";
export const PRESCRIPTION_WEEK = 3;
export const PRESCRIPTION_TOTAL_WEEKS = 5;

// coachComments: comentarios de celda que la coach dejó el 29 de octubre en las
// columnas de la semana 3, sobre los videos de la semana 2.
// previousCoachComments: los de semanas anteriores, que siguen visibles.
//
// Ya hay comentarios para la semana 4 (cargarlos junto con esa pauta):
// - M1!X15, Leg Press: "En la primera serie 5 reps y las demás 12."
// - M1!AA23, primer ejercicio del bloque E: "Trata de mantener 1 segundo arriba y bajar en 3 segundos."

// El bloque E (los dos últimos de cada día) venía marcado como biserie en el
// prototipo anterior, pero la especificación pide no convertir eso en una
// obligación automática sin revisar la pauta real. Se mantiene como referencia
// heredada, visible pero no forzada: la app permite completar cada ejercicio
// del bloque de forma independiente.

export const PRESCRIPTION_DAY1: Prescription[] = [
  { id: "d1-1", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "rotation", order: 1, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
  { id: "d1-2", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "er", order: 2, block: "Calentamiento", sets: 2, repsText: "5 por lado", loadText: "2,5 kg", isWarmup: true },
  { id: "d1-3", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "hips", order: 3, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
  { id: "d1-4", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "legpress", order: 4, block: "A", sets: 4, repsText: "10", loadText: "20 / 30 / = / =", isWarmup: false, coachComments: ["¡Mucho mejor!"], previousCoachComments: ["Evaluemos si te sigue doliendo esta semana.", "Atrás del respaldo hay un cosito para acomodarlo: trata de bajarla 1 posición, para que así puedas bajar más y quizás más cómodamente."] },
  { id: "d1-5", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "row", order: 5, block: "B", sets: 3, repsText: "10 / 10 / 12 por lado", loadText: "7,5 kg", isWarmup: false, coachNote: "Por serie: repeticiones de la 1.ª, 2.ª y 3.ª serie.", coachComments: ["¡Muy bien ejecutado!"], previousCoachComments: ["Tranquila, lo acepto. Si hay de 6 kg, hacer 12; y si es de 7 kg, 10 a 15 reps, 3 series. ¡Pero muy bien!", "Trata de llevar la mancuerna hacia tu cadera, más que sólo hacia arriba.", "Carga: lo que haya disponible."] },
  { id: "d1-6", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "curl", order: 6, block: "C", sets: 3, repsText: "12 a 15", loadText: "Subirle una placa (la semana pasada: 25 kg)", isWarmup: false, coachComments: ["Bien posicionada en la máquina. Quizás puedes levantar un nivel el rodillo de las piernas para darle más rango."] },
  { id: "d1-7", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "press", order: 7, block: "D", sets: 3, repsText: "8", loadText: "14 kg", isWarmup: false, coachComments: ["Trata de posicionarte de esa forma para que no te moleste, y quizás quítale un poquito de rango en las primeras."], previousCoachComments: ["¡Muy bien! Quizás te molesta porque no estás acostumbrada a ese tipo de empuje."] },
  { id: "d1-8", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "unknown", order: 8, block: "E", sets: 3, repsText: "10 a 12", loadText: "2,5 kg por lado, banco a 60°", isWarmup: false, coachComments: ["¡Bieeeeen! Trata de mantener 1 segundo arriba y bajar en 2 segundos."], previousCoachComments: ["¡Muy bien!!! Baja un poquito más controlado para la próxima."] },
  { id: "d1-9", version: PRESCRIPTION_VERSION, day: 1, exerciseId: "bear", order: 9, block: "E", sets: 3, repsText: "8 por lado", loadText: null, isWarmup: false, coachComments: ["¡Bieeen! Está mucho mejor que la primera vez también. Trata de que las rodillas queden bajo la cadera."], previousCoachComments: ["¡Muy bien! Sólo tratar de no mover tanto la colita, activa bien el core."] },
];

export const PRESCRIPTION_DAY2: Prescription[] = [
  { id: "d2-1", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "rotation", order: 1, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
  { id: "d2-2", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "er", order: 2, block: "Calentamiento", sets: 2, repsText: "5 por lado", loadText: "2 kg", isWarmup: true },
  { id: "d2-3", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "hams", order: 3, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: null, isWarmup: true },
  { id: "d2-4", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "rdl", order: 4, block: "A", sets: 4, repsText: "10", loadText: "20 / 30 kg / = / =", isWarmup: false, coachComments: ["¡Muy buena ejecución! Yo creo que podrías másssss. ¡Muy bien!"] },
  { id: "d2-5", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "incline", order: 5, block: "B", sets: 3, repsText: "10 a 12", loadText: "10 × 5 kg / 10 × 5 kg / 8 × 6 kg", isWarmup: false, coachNote: "Por serie: repeticiones × kilos." },
  { id: "d2-6", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "extension", order: 6, block: "C", sets: 3, repsText: "10 a 12", loadText: "20 kg", isWarmup: false, coachComments: ["No caché mucho el movimiento, pero bien, jajaja. La próxima le subiremos."] },
  { id: "d2-7", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "pulldown", order: 7, block: "D", sets: 3, repsText: "10 a 12", loadText: "Había que subirle una plaquita; ahora subirle 2", isWarmup: false },
  { id: "d2-8", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "clamshell", order: 8, block: "E", sets: 3, repsText: "10 a 12 por lado", loadText: "Si hay banda, usar una light/med", isWarmup: false, coachComments: ["Trata de quedar en una posición con la cadera completamente estirada y hacia adelante, no sacando la colita."] },
  { id: "d2-9", version: PRESCRIPTION_VERSION, day: 2, exerciseId: "crunch", order: 9, block: "E", sets: 3, repsText: "10 a 15", loadText: "6 kg", isWarmup: false, coachComments: ["Aquí modificaremos algo: no llevaremos hacia adelante, sino hacia arriba, lo que más puedas, y bajar controlado."] },
];

// "Comentarios para la próxima semana" que la coach escribió en el bloque del día.
export const DAY_COACH_NOTES: Record<Day, string | null> = {
  1: null,
  2: "¡Muy bien!!! Vamos mejorando cada día más!",
};

export function getPrescription(day: 1 | 2): Prescription[] {
  return day === 1 ? PRESCRIPTION_DAY1 : PRESCRIPTION_DAY2;
}
