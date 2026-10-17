import { NavLink } from "react-router-dom";

const ITEMS = [
  { to: "/", label: "Hoy", icon: "🏠" },
  { to: "/historial", label: "Historial", icon: "📅" },
  { to: "/videos", label: "Mis videos", icon: "🎥" },
  { to: "/ajustes", label: "Ajustes", icon: "⚙️" },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`}
        >
          <span className="bottom-nav__icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
