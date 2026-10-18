import { useState, type FormEvent, type ReactNode } from "react";

// Candado liviano del lado del cliente. El repo es público, así que esto
// NO es seguridad real: el código queda embebido en el JS compilado y
// cualquiera que mire el bundle puede leerlo. Sirve solo para que nadie
// entre por accidente al tropezar con el link. Si alguna vez se necesita
// algo serio, hace falta un backend con autenticación de verdad.

const STORAGE_KEY = "sanwoot-access-until";
const SESSION_HOURS = 24;

function hasValidSession(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  const until = Number(raw);
  return Number.isFinite(until) && Date.now() < until;
}

function grantSession(): void {
  const until = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  localStorage.setItem(STORAGE_KEY, String(until));
}

export function AccessGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(hasValidSession);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const expected = (import.meta.env.VITE_ACCESS_CODE ?? "").trim();

  // Si no se configuró código (ej. en desarrollo local sin .env.local), no bloquear.
  if (!expected) return <>{children}</>;

  if (unlocked) return <>{children}</>;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim().toLowerCase() === expected.toLowerCase()) {
      grantSession();
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="gate">
      <form className="gate__card" onSubmit={onSubmit}>
        <h1 className="gate__title">SanWoot</h1>
        <p className="gate__hint">Ingresa la clave para entrar.</p>
        <input
          className="gate__input"
          type="password"
          autoComplete="off"
          autoFocus
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(false);
          }}
          placeholder="Clave"
        />
        {error && <p className="gate__error">Clave incorrecta.</p>}
        <button className="btn btn--primary btn--large" type="submit">
          Entrar
        </button>
        <p className="gate__note">Quedas conectada por 24 horas en este teléfono.</p>
      </form>
    </div>
  );
}
