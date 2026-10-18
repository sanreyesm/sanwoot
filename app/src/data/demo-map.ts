import catalog from "./video-catalog.json";
import { getOverride } from "../lib/exercise-overrides";

export type DemoConfidence = "exact" | "approximate" | "pending";

export interface DemoMapping {
  exerciseId: string;
  confidence: DemoConfidence;
  /** originalName tal como aparece en video-catalog.json (nombre del archivo original en inglés). */
  catalogOriginalName?: string;
  note?: string;
}

export interface CatalogEntry {
  originalName: string;
  slug: string;
  file: string;
  sizeBytes: number;
}

export const CATALOG = catalog as CatalogEntry[];

// Mapeo verificado el 16 oct 2026 contra los 378 archivos de "Video ejercicios/".
// 'exact': el nombre del catálogo corresponde al ejercicio de la pauta.
// 'approximate': no hay match exacto; se usa el más cercano, mostrado con aviso.
// 'pending': no hay nada razonablemente parecido; se muestra "Demostración pendiente" + enlace externo.
//
// San puede anular cualquiera de estos tres con su propia elección (video del
// catálogo o URL de YouTube), guardada en exercise-overrides. resolveDemo()
// siempre revisa esa anulación primero.
export const DEMO_MAPPINGS: DemoMapping[] = [
  { exerciseId: "rotation", confidence: "pending", note: "Sin match en el catálogo local." },
  { exerciseId: "er", confidence: "pending", note: "Sin match en el catálogo local." },
  { exerciseId: "hips", confidence: "pending", note: "Sin match en el catálogo local." },
  { exerciseId: "legpress", confidence: "approximate", catalogOriginalName: "Incline Leg Press", note: "Variante inclinada; verificar si es la misma máquina del gimnasio." },
  { exerciseId: "row", confidence: "approximate", catalogOriginalName: "One Arm Dumbbell Row", note: "Fila con mancuerna a una mano; la pauta pide apoyo de 3 puntos, no idéntico." },
  { exerciseId: "curl", confidence: "approximate", catalogOriginalName: "Lying Leg Curls", note: "Variante acostada; confirmar si San lo hace sentada." },
  { exerciseId: "press", confidence: "approximate", catalogOriginalName: "Chest Press-Machine", note: "Press de pecho en máquina; verificar si es la máquina horizontal del gimnasio." },
  { exerciseId: "unknown", confidence: "pending", note: "Ejercicio sin nombre identificado; no se puede buscar un video sin saber qué es." },
  { exerciseId: "bear", confidence: "pending", note: "Sin match en el catálogo local." },
  { exerciseId: "hams", confidence: "pending", note: "Sin match en el catálogo local." },
  { exerciseId: "rdl", confidence: "approximate", catalogOriginalName: "Romanian Deadlift", note: "Romanian deadlift estándar; la pauta anota 'por lado', que no es típico para RDL con barra." },
  { exerciseId: "incline", confidence: "exact", catalogOriginalName: "Incline Bench Press" },
  { exerciseId: "extension", confidence: "exact", catalogOriginalName: "Leg Extensions" },
  { exerciseId: "pulldown", confidence: "approximate", catalogOriginalName: "Lat Pulldowns", note: "Jalón al pecho estándar; verificar si es la máquina 'Pulldown machine' del gimnasio." },
  { exerciseId: "clamshell", confidence: "exact", catalogOriginalName: "Clamshell" },
  { exerciseId: "crunch", confidence: "approximate", catalogOriginalName: "High Pulley Crunches", note: "Crunch con polea alta; la pauta dice 'vertical crunch' sin más detalle." },
];

export interface ResolvedDemo {
  confidence: DemoConfidence;
  file?: string;
  note?: string;
  /** Si está presente, DemoPlayer embebe esto en vez de usar `file`. */
  youtubeUrl?: string;
  /** true si San lo eligió a mano (video del catálogo o YouTube), no el mapeo automático. */
  chosenByUser?: boolean;
}

function resolveAutoMapping(exerciseId: string): { confidence: DemoConfidence; file?: string; note?: string } {
  const mapping = DEMO_MAPPINGS.find((m) => m.exerciseId === exerciseId);
  if (!mapping) return { confidence: "pending" };
  if (mapping.confidence === "pending" || !mapping.catalogOriginalName) {
    return { confidence: "pending", note: mapping.note };
  }
  const entry = CATALOG.find((c) => c.originalName === mapping.catalogOriginalName);
  if (!entry) return { confidence: "pending", note: "El archivo esperado no está en el catálogo generado." };
  return { confidence: mapping.confidence, file: entry.file, note: mapping.note };
}

export function resolveDemo(exerciseId: string): ResolvedDemo {
  const override = getOverride(exerciseId);

  if (override?.demoYoutubeOverride) {
    return { confidence: "exact", youtubeUrl: override.demoYoutubeOverride, note: "Video elegido por ti.", chosenByUser: true };
  }
  if (override?.demoFileOverride) {
    const entry = CATALOG.find((c) => c.file === override.demoFileOverride);
    if (entry) {
      return { confidence: "exact", file: entry.file, note: "Video elegido por ti del catálogo.", chosenByUser: true };
    }
  }
  return resolveAutoMapping(exerciseId);
}

/** @deprecated usar resolveDemo(), que respeta las elecciones de video de San. */
export function resolveDemoFile(exerciseId: string): { confidence: DemoConfidence; file?: string; note?: string } {
  return resolveDemo(exerciseId);
}
