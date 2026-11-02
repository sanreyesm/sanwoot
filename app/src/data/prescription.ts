import type { Day, Prescription } from "../types";

// Pauta del coach, semana por semana, leída de la pestaña M1 del Sheet
// (7 columnas por semana: S1 A–G, S2 H–N, S3 O–U, S4 V–AB, S5 AC+).
//
// Cada semana guarda solo SUS comentarios de la coach (los comentarios de
// celda anclados en las columnas de esa semana), para que no se mezclen los
// de semanas anteriores con los actuales.
//
// version identifica cada copia: cada sesión guarda con qué versión se hizo,
// así el historial de una semana queda intacto al cargar la siguiente. Las
// versiones de las semanas 1 a 3 son las que ya usaban las sesiones guardadas.
//
// El bloque E (los dos últimos de cada día) venía marcado como biserie en el
// prototipo anterior, pero la especificación pide no convertir eso en una
// obligación automática sin revisar la pauta real. Se mantiene como referencia
// heredada, visible pero no forzada: la app permite completar cada ejercicio
// del bloque de forma independiente.

export const PRESCRIPTION_TOTAL_WEEKS = 5;

export interface WeekPlan {
  week: number;
  version: string;
  days: Record<Day, Prescription[]>;
  /** "Comentarios para la próxima semana" que la coach escribió en el bloque del día. */
  dayCoachNotes: Record<Day, string | null>;
}

type Row = Omit<Prescription, "id" | "version" | "day">;

function buildDays(week: number, version: string, day1: Row[], day2: Row[]): Record<Day, Prescription[]> {
  const build = (day: Day, rows: Row[]) =>
    rows.map((r) => ({ ...r, id: `w${week}-d${day}-${r.order}`, version, day }));
  return { 1: build(1, day1), 2: build(2, day2) };
}

// Semana 1: importación del 15 de octubre de 2026 (columnas A a G).
const WEEK_1: WeekPlan = {
  week: 1,
  version: "2026-10-15-import",
  days: buildDays(1, "2026-10-15-import", [
    { exerciseId: "rotation", order: 1, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
    { exerciseId: "er", order: 2, block: "Calentamiento", sets: 2, repsText: null, loadText: "2 kg", isWarmup: true, coachNote: "Repeticiones no indicadas en la pauta." },
    { exerciseId: "hips", order: 3, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
    { exerciseId: "legpress", order: 4, block: "A", sets: 4, repsText: "10 a 12", loadText: "20 / 30 / = / =", isWarmup: false },
    { exerciseId: "row", order: 5, block: "B", sets: 3, repsText: "8 a 12 por lado", loadText: "7 kg (con interrogante)", isWarmup: false },
    { exerciseId: "curl", order: 6, block: "C", sets: 3, repsText: "10 a 12", loadText: "Probar 25 a 30 kg", isWarmup: false },
    { exerciseId: "press", order: 7, block: "D", sets: 3, repsText: "10 a 12", loadText: "Probar 2 placas", isWarmup: false },
    { exerciseId: "unknown", order: 8, block: "E", sets: 3, repsText: "10 a 12", loadText: "2 a 2,5 kg por lado, banco a 60°", isWarmup: false },
    { exerciseId: "bear", order: 9, block: "E", sets: 3, repsText: "8 a 10 por lado", loadText: null, isWarmup: false },
  ], [
    { exerciseId: "rotation", order: 1, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
    { exerciseId: "er", order: 2, block: "Calentamiento", sets: 2, repsText: null, loadText: "2 kg", isWarmup: true, coachNote: "Repeticiones no indicadas en la pauta." },
    { exerciseId: "hams", order: 3, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
    { exerciseId: "rdl", order: 4, block: "A", sets: 4, repsText: "8 a 10 por lado (tal como aparece en la pauta)", loadText: "20 / 30 kg / = / =", isWarmup: false },
    { exerciseId: "incline", order: 5, block: "B", sets: 3, repsText: "10 a 12", loadText: "5 a 6 kg por lado (con interrogante)", isWarmup: false },
    { exerciseId: "extension", order: 6, block: "C", sets: 3, repsText: "10 a 12", loadText: "Probar 15 a 20 kg", isWarmup: false },
    { exerciseId: "pulldown", order: 7, block: "D", sets: 3, repsText: "10 a 12", loadText: "Probar 15 a 20 kg", isWarmup: false },
    { exerciseId: "clamshell", order: 8, block: "E", sets: 3, repsText: "8 a 10 por lado", loadText: "Sin banda; consultar disponibilidad", isWarmup: false },
    { exerciseId: "crunch", order: 9, block: "E", sets: 3, repsText: "10 a 15", loadText: "5 kg", isWarmup: false },
  ]),
  dayCoachNotes: {
    1: "Sé que algunos ejercicios están en diferentes pisos, pero es por eso que no haremos biseries, así te complica menos turnar las máquinas. En caso de que no puedas seguir el orden, no hay problema, pero ojalá que los primeros dos bloques sean los iniciales. Si están mega fáciles, ir subiendo un poquito cada serie: la idea es probar el peso y evaluar si está como para hacer las reps indicadas.",
    2: null,
  },
};

// Semana 2: leída el 23 de octubre de 2026 (columnas H a N). Comentarios de
// celda del 20 y 23 de octubre.
const WEEK_2: WeekPlan = {
  week: 2,
  version: "2026-10-23-semana-2",
  days: buildDays(2, "2026-10-23-semana-2", [
    { exerciseId: "rotation", order: 1, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
    { exerciseId: "er", order: 2, block: "Calentamiento", sets: 2, repsText: "5 por lado", loadText: "2,5 kg", isWarmup: true },
    { exerciseId: "hips", order: 3, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
    { exerciseId: "legpress", order: 4, block: "A", sets: 4, repsText: "10", loadText: "20 / 30 / = / =", isWarmup: false, coachComments: ["Evaluemos si te sigue doliendo esta semana.", "Atrás del respaldo hay un cosito para acomodarlo: trata de bajarla 1 posición, para que así puedas bajar más y quizás más cómodamente."] },
    { exerciseId: "row", order: 5, block: "B", sets: 3, repsText: "8 a 12 por lado", loadText: "6 a 7 kg", isWarmup: false, coachComments: ["Tranquila, lo acepto. Si hay de 6 kg, hacer 12; y si es de 7 kg, 10 a 15 reps, 3 series. ¡Pero muy bien!", "Trata de llevar la mancuerna hacia tu cadera, más que sólo hacia arriba.", "Carga: lo que haya disponible."] },
    { exerciseId: "curl", order: 6, block: "C", sets: 3, repsText: "12 a 15", loadText: "25 kg", isWarmup: false },
    { exerciseId: "press", order: 7, block: "D", sets: 3, repsText: "8", loadText: "14 kg", isWarmup: false, coachComments: ["¡Muy bien! Quizás te molesta porque no estás acostumbrada a ese tipo de empuje."] },
    { exerciseId: "unknown", order: 8, block: "E", sets: 3, repsText: "10", loadText: "2,5 kg por lado, banco a 60°", isWarmup: false, coachComments: ["¡Muy bien!!! Baja un poquito más controlado para la próxima."] },
    { exerciseId: "bear", order: 9, block: "E", sets: 3, repsText: "8 por lado", loadText: null, isWarmup: false, coachComments: ["¡Muy bien! Sólo tratar de no mover tanto la colita, activa bien el core."] },
  ], [
    { exerciseId: "rotation", order: 1, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
    { exerciseId: "er", order: 2, block: "Calentamiento", sets: 2, repsText: "5 por lado", loadText: "2 kg", isWarmup: true },
    { exerciseId: "hams", order: 3, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: null, isWarmup: true },
    { exerciseId: "rdl", order: 4, block: "A", sets: 4, repsText: "8 a 10 por lado (tal como aparece en la pauta)", loadText: "20 / 30 kg / = / =", isWarmup: false },
    { exerciseId: "incline", order: 5, block: "B", sets: 3, repsText: "10 a 12", loadText: "10 × 5 kg / 10 × 5 kg / 8 × 6 kg", isWarmup: false, coachNote: "Por serie: repeticiones × kilos." },
    { exerciseId: "extension", order: 6, block: "C", sets: 3, repsText: "12", loadText: "20 kg", isWarmup: false },
    { exerciseId: "pulldown", order: 7, block: "D", sets: 3, repsText: "10 a 12", loadText: "21 kg + 1 plaquita", isWarmup: false },
    { exerciseId: "clamshell", order: 8, block: "E", sets: 3, repsText: "8 por lado", loadText: "Sin banda; consultar si hay bandas", isWarmup: false },
    { exerciseId: "crunch", order: 9, block: "E", sets: 3, repsText: "10 a 15", loadText: "5 kg", isWarmup: false },
  ]),
  dayCoachNotes: { 1: null, 2: null },
};

// Semana 3: leída el 1 de noviembre de 2026 (columnas O a U). Comentarios de
// celda del 29 de octubre.
const WEEK_3: WeekPlan = {
  week: 3,
  version: "2026-11-01-semana-3",
  days: buildDays(3, "2026-11-01-semana-3", [
    { exerciseId: "rotation", order: 1, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
    { exerciseId: "er", order: 2, block: "Calentamiento", sets: 2, repsText: "5 por lado", loadText: "2,5 kg", isWarmup: true },
    { exerciseId: "hips", order: 3, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
    { exerciseId: "legpress", order: 4, block: "A", sets: 4, repsText: "10", loadText: "20 / 30 / = / =", isWarmup: false, coachComments: ["¡Mucho mejor!"] },
    { exerciseId: "row", order: 5, block: "B", sets: 3, repsText: "10 / 10 / 12 por lado", loadText: "7,5 kg", isWarmup: false, coachNote: "Por serie: repeticiones de la 1.ª, 2.ª y 3.ª serie.", coachComments: ["¡Muy bien ejecutado!"] },
    { exerciseId: "curl", order: 6, block: "C", sets: 3, repsText: "12 a 15", loadText: "Subirle una placa (la semana pasada: 25 kg)", isWarmup: false, coachComments: ["Bien posicionada en la máquina. Quizás puedes levantar un nivel el rodillo de las piernas para darle más rango."] },
    { exerciseId: "press", order: 7, block: "D", sets: 3, repsText: "8", loadText: "14 kg", isWarmup: false, coachComments: ["Trata de posicionarte de esa forma para que no te moleste, y quizás quítale un poquito de rango en las primeras."] },
    { exerciseId: "unknown", order: 8, block: "E", sets: 3, repsText: "10 a 12", loadText: "2,5 kg por lado, banco a 60°", isWarmup: false, coachComments: ["¡Bieeeeen! Trata de mantener 1 segundo arriba y bajar en 2 segundos."] },
    { exerciseId: "bear", order: 9, block: "E", sets: 3, repsText: "8 por lado", loadText: null, isWarmup: false, coachComments: ["¡Bieeen! Está mucho mejor que la primera vez también. Trata de que las rodillas queden bajo la cadera."] },
  ], [
    { exerciseId: "rotation", order: 1, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
    { exerciseId: "er", order: 2, block: "Calentamiento", sets: 2, repsText: "5 por lado", loadText: "2 kg", isWarmup: true },
    { exerciseId: "hams", order: 3, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: null, isWarmup: true },
    { exerciseId: "rdl", order: 4, block: "A", sets: 4, repsText: "10", loadText: "20 / 30 kg / = / =", isWarmup: false, coachComments: ["¡Muy buena ejecución! Yo creo que podrías másssss. ¡Muy bien!"] },
    { exerciseId: "incline", order: 5, block: "B", sets: 3, repsText: "10 a 12", loadText: "10 × 5 kg / 10 × 5 kg / 8 × 6 kg", isWarmup: false, coachNote: "Por serie: repeticiones × kilos." },
    { exerciseId: "extension", order: 6, block: "C", sets: 3, repsText: "10 a 12", loadText: "20 kg", isWarmup: false, coachComments: ["No caché mucho el movimiento, pero bien, jajaja. La próxima le subiremos."] },
    { exerciseId: "pulldown", order: 7, block: "D", sets: 3, repsText: "10 a 12", loadText: "Había que subirle una plaquita; ahora subirle 2", isWarmup: false },
    { exerciseId: "clamshell", order: 8, block: "E", sets: 3, repsText: "10 a 12 por lado", loadText: "Si hay banda, usar una light/med", isWarmup: false, coachComments: ["Trata de quedar en una posición con la cadera completamente estirada y hacia adelante, no sacando la colita."] },
    { exerciseId: "crunch", order: 9, block: "E", sets: 3, repsText: "10 a 15", loadText: "6 kg", isWarmup: false, coachComments: ["Aquí modificaremos algo: no llevaremos hacia adelante, sino hacia arriba, lo que más puedas, y bajar controlado."] },
  ]),
  dayCoachNotes: { 1: null, 2: "¡Muy bien!!! Vamos mejorando cada día más!" },
};

// Semana 4: leída el 2 de noviembre de 2026 (columnas V a AB). La coach la
// dejó adelantada antes de sus vacaciones. Comentarios de celda del 29 de octubre
// (M1!X15 y M1!AA23). El comentario del día 2 está copiado tal cual en la planilla.
const WEEK_4: WeekPlan = {
  week: 4,
  version: "2026-11-02-semana-4",
  days: buildDays(4, "2026-11-02-semana-4", [
    { exerciseId: "rotation", order: 1, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
    { exerciseId: "er", order: 2, block: "Calentamiento", sets: 2, repsText: "5 por lado", loadText: "2,5 kg", isWarmup: true },
    { exerciseId: "hips", order: 3, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
    { exerciseId: "legpress", order: 4, block: "A", sets: 4, repsText: "5 / 12 / 12 / 12", loadText: "20 / 30 / = / =", isWarmup: false, coachNote: "En la pauta dice «leer comentario»; las repeticiones salen de su comentario.", coachComments: ["En la primera serie 5 reps y las demás 12."] },
    { exerciseId: "row", order: 5, block: "B", sets: 3, repsText: "12 por lado", loadText: "7,5 kg", isWarmup: false },
    { exerciseId: "curl", order: 6, block: "C", sets: 3, repsText: "10 a 15", loadText: "Subirle 2 placas", isWarmup: false },
    { exerciseId: "press", order: 7, block: "D", sets: 3, repsText: "8 a 9", loadText: "14 kg", isWarmup: false },
    { exerciseId: "unknown", order: 8, block: "E", sets: 3, repsText: null, loadText: null, isWarmup: false, coachNote: "La pauta no indica repeticiones ni carga esta semana.", coachComments: ["Trata de mantener 1 segundo arriba y bajar en 3 segundos."] },
    { exerciseId: "bear", order: 9, block: "E", sets: 3, repsText: "8 / 8 / 9 por lado", loadText: null, isWarmup: false },
  ], [
    { exerciseId: "rotation", order: 1, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: "Sin carga", isWarmup: true },
    { exerciseId: "er", order: 2, block: "Calentamiento", sets: 2, repsText: "5 por lado", loadText: "2 kg", isWarmup: true },
    { exerciseId: "hams", order: 3, block: "Calentamiento", sets: 2, repsText: "6 por lado", loadText: null, isWarmup: true },
    { exerciseId: "rdl", order: 4, block: "A", sets: 4, repsText: "5 / 12 / 12 / 12", loadText: "20 / 30 kg / = / =", isWarmup: false },
    { exerciseId: "incline", order: 5, block: "B", sets: 3, repsText: "10 / 10 / 8 a 10", loadText: "10 × 5 kg / 10 × 5 kg / 8 a 10 × 6 kg", isWarmup: false, coachNote: "Por serie: repeticiones × kilos." },
    { exerciseId: "extension", order: 6, block: "C", sets: 3, repsText: "10 a 12", loadText: "Subir una placa", isWarmup: false },
    { exerciseId: "pulldown", order: 7, block: "D", sets: 3, repsText: "10 a 12", loadText: "Mantener el peso que dejaste la semana anterior", isWarmup: false },
    { exerciseId: "clamshell", order: 8, block: "E", sets: 3, repsText: "10 a 15 por lado", loadText: "Si hay banda, usar una light/med", isWarmup: false },
    { exerciseId: "crunch", order: 9, block: "E", sets: 3, repsText: "10 a 15", loadText: "7 kg", isWarmup: false },
  ]),
  dayCoachNotes: { 1: null, 2: "¡Muy bien!!! Vamos mejorando cada día más!" },
};

// La semana 5 (columnas AC en adelante) todavía está vacía en la planilla.
export const WEEKS: WeekPlan[] = [WEEK_1, WEEK_2, WEEK_3, WEEK_4];

export function getWeekPlan(week: number): WeekPlan | undefined {
  return WEEKS.find((w) => w.week === week);
}

export function getPrescription(week: number, day: Day): Prescription[] {
  return getWeekPlan(week)?.days[day] ?? [];
}

/** Semana a la que corresponde una versión de pauta (para sesiones guardadas antes de que existiera WorkoutSession.week). */
export function weekForVersion(version: string): number | null {
  return WEEKS.find((w) => w.version === version)?.week ?? null;
}
