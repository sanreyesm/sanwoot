import { NavLink } from "react-router-dom";
import { Icon, type IconName } from "./Icon";

const ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: "/", label: "Hoy", icon: "calendar" },
  { to: "/historial", label: "Historial", icon: "history" },
  { to: "/videos", label: "Mis videos", icon: "video" },
  { to: "/ajustes", label: "Ajustes", icon: "settings" },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Principal">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) => `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`}
        >
          <Icon name={item.icon} size={22} strokeWidth={2.2} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
