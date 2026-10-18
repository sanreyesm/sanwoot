// Registro manual del service worker (injectRegister: false en vite.config.ts,
// a propósito, para controlar aquí cuándo y cómo se registra).
export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return; // en dev, Vite sirve sin SW para no interferir con HMR
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((err) => {
      console.error("No se pudo registrar el service worker", err);
    });
  });
}
