import type { Exercise } from "../types";

export const MUSCLE_GROUPS = ["Tren superior", "Tren inferior", "Core"];

export const FLOORS: { value: Exercise["floor"]; label: string }[] = [
  { value: "-1", label: "Piso -1" },
  { value: "3", label: "Piso 3" },
  { value: "any", label: "Cualquier piso" },
  { value: "unknown", label: "Por confirmar" },
];

export function floorLabel(floor: Exercise["floor"]): string {
  switch (floor) {
    case "-1":
      return "Piso -1";
    case "3":
      return "Piso 3";
    case "any":
      return "Cualquier piso";
    default:
      return "Piso por confirmar";
  }
}
