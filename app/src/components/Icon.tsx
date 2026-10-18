// Set de íconos tomado tal cual de SanWoot-version-final.html (la propuesta
// de diseño aprobada). Mismos paths SVG, para que la app real se vea
// exactamente igual al mockup, no una aproximación.

export type IconName =
  | "check"
  | "clock"
  | "download"
  | "arrow-right"
  | "calendar"
  | "history"
  | "video"
  | "settings"
  | "circle"
  | "half-circle"
  | "skip"
  | "wifi"
  | "chevron-left"
  | "chevron-right"
  | "arrow-up"
  | "arrow-down"
  | "warning"
  | "undo"
  | "play"
  | "dashed-wave"
  | "close"
  | "plus"
  | "attach"
  | "device"
  | "share"
  | "trash"
  | "chevron-up"
  | "chevron-down"
  | "no-connection"
  | "record-dot";

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const PATHS: Record<IconName, { d: string[]; circles?: { cx: number; cy: number; r: number; fill?: string }[]; rect?: { x: number; y: number; w: number; h: number; rx: number } }> = {
  check: { d: ["M5 12l5 5L20 7"] },
  clock: { d: ["M12 7v5l3 2"], circles: [{ cx: 12, cy: 12, r: 9 }] },
  download: { d: ["M12 4v11M7 10l5 5 5-5M5 20h14"] },
  "arrow-right": { d: ["M5 12h14M13 6l6 6-6 6"] },
  calendar: { d: ["M3 10h18M8 3v4M16 3v4"], rect: { x: 3, y: 5, w: 18, h: 16, rx: 2 } },
  history: { d: ["M3 12a9 9 0 1 0 3-6.7L3 8", "M3 3v5h5M12 7v5l3 2"] },
  video: { d: ["M16 10l5-3v10l-5-3z"], rect: { x: 3, y: 6, w: 13, h: 12, rx: 2 } },
  settings: {
    d: ["M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"],
    circles: [
      { cx: 15, cy: 6, r: 2 },
      { cx: 9, cy: 12, r: 2 },
      { cx: 17, cy: 18, r: 2 },
    ],
  },
  circle: { d: [], circles: [{ cx: 12, cy: 12, r: 8.5 }] },
  "half-circle": { d: ["M12 3.5a8.5 8.5 0 0 1 0 17z"], circles: [{ cx: 12, cy: 12, r: 8.5 }] },
  skip: { d: ["M6 5l9 7-9 7zM18 5v14"] },
  wifi: { d: ["M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 17.7 9.5 4.25 4.25 0 0 1 17.5 18z", "M4 4l16 16"] },
  "chevron-left": { d: ["M15 6l-6 6 6 6"] },
  "chevron-right": { d: ["M9 6l6 6-6 6"] },
  "arrow-up": { d: ["M12 19V5M6 11l6-6 6 6"] },
  "arrow-down": { d: ["M12 5v14M6 13l6 6 6-6"] },
  warning: { d: ["M12 3l10 18H2z", "M12 10v4M12 17.5v.5"] },
  undo: { d: ["M4 12a8 8 0 1 0 2.5-5.8L4 8.5", "M4 4v4.5h4.5"] },
  play: { d: ["M8 5l12 7-12 7z"] },
  "dashed-wave": { d: ["M5 9c2-2 4-2 7 0s5 2 7 0M5 15c2-2 4-2 7 0s5 2 7 0"] },
  close: { d: ["M6 6l12 12M18 6L6 18"] },
  plus: { d: ["M12 5v14M5 12h14"] },
  attach: { d: ["M20 11l-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7"] },
  device: { d: ["M11 18h2"], rect: { x: 7, y: 3, w: 10, h: 18, rx: 2 } },
  share: { d: ["M12 3v13M7 8l5-5 5 5M5 14v6h14v-6"] },
  trash: { d: ["M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"] },
  "chevron-up": { d: ["M6 15l6-6 6 6"] },
  "chevron-down": { d: ["M6 9l6 6 6-6"] },
  "no-connection": { d: ["M3 3l18 18", "M9 3v4M15 3v4M7 7h10v4a5 5 0 0 1-1.5 3.6M9.6 15.6A5 5 0 0 1 7 11V7M12 16v5"] },
  "record-dot": { d: [], circles: [{ cx: 12, cy: 12, r: 8, fill: "#C33C9B" }] },
};

export function Icon({ name, size = 14, strokeWidth = 2.4, className }: IconProps) {
  const spec = PATHS[name];
  const hasFillCircle = spec.circles?.some((c) => c.fill);
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={hasFillCircle ? "none" : "none"}
      stroke={hasFillCircle ? "none" : "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {spec.rect && <rect x={spec.rect.x} y={spec.rect.y} width={spec.rect.w} height={spec.rect.h} rx={spec.rect.rx} />}
      {spec.circles?.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={c.fill ?? "none"} stroke={c.fill ? "none" : "currentColor"} />
      ))}
      {spec.d.map((d, i) => (
        <path key={i} d={d} fill={name === "half-circle" ? "currentColor" : "none"} />
      ))}
    </svg>
  );
}
