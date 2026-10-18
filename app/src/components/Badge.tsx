import { Icon, type IconName } from "./Icon";

// Variantes tal como las define "Sistema de componentes" en
// SanWoot-version-final.html: siempre ícono + texto, nunca solo color.
export type BadgeVariant =
  | "offline"
  | "pending"
  | "approximate"
  | "device"
  | "error"
  | "complete"
  | "partial"
  | "unregistered"
  | "skipped"
  | "not-connected";

const VARIANT: Record<BadgeVariant, { icon: IconName; bg: string; color: string; border?: string; filled?: boolean; dashed?: boolean }> = {
  offline: { icon: "wifi", bg: "#E0F0E6", color: "#1E5C3A" },
  pending: { icon: "clock", bg: "#FBEACB", color: "#7A4A00" },
  approximate: { icon: "dashed-wave", bg: "#FFFFFF", color: "#6E2A5A", border: "#6E2A5A", dashed: true },
  device: { icon: "device", bg: "#F2E4EE", color: "#5A2149" },
  error: { icon: "warning", bg: "#FDE3E3", color: "#A3161F" },
  complete: { icon: "check", bg: "#C33D9C", color: "#FFFFFF", filled: true },
  partial: { icon: "half-circle", bg: "#F2E4EE", color: "#5A2149" },
  unregistered: { icon: "circle", bg: "#FFFFFF", color: "#48454F", border: "#726E79" },
  skipped: { icon: "skip", bg: "#E6E4DF", color: "#3A3840" },
  "not-connected": { icon: "no-connection", bg: "#FFFFFF", color: "#48454F", border: "#48454F", dashed: true },
};

export function Badge({ variant, children }: { variant: BadgeVariant; children: React.ReactNode }) {
  const v = VARIANT[variant];
  return (
    <span
      className="badge"
      style={{
        background: v.bg,
        color: v.color,
        border: v.border ? `1.5px ${v.dashed ? "dashed" : "solid"} ${v.border}` : undefined,
      }}
    >
      <Icon name={v.icon} size={11} />
      <span>{children}</span>
    </span>
  );
}
