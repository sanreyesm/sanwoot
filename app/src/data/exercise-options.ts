import type { Exercise } from "../types";

export const MUSCLE_GROUPS = ["Tren superior", "Tren inferior", "Core"];

export const FLOORS: { value: Exercise["floor"]; label: string }[] = [
  { value: "-1", label: "Piso -1" },
  { value: "3", label: "Piso 3" },
  { value: "unknown", label: "Por confirmar" },
];
