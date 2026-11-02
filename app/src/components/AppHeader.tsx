// Barra superior (no fija: se va con el scroll). La barra de estado de iOS es
// translúcida (black-translucent + viewport-fit=cover), así que el padding
// superior deja libre la zona de la hora y el notch.
export function AppHeader() {
  return (
    <header className="app-header">
      <span className="app-header__title">SanWoot</span>
    </header>
  );
}
