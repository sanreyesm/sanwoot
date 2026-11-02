// Barra superior fija. La barra de estado de iOS es translúcida
// (black-translucent + viewport-fit=cover), así que sin esto el contenido
// queda debajo de la hora y el notch al hacer scroll.
export function AppHeader() {
  return (
    <header className="app-header">
      <span className="app-header__title">SanWoot</span>
    </header>
  );
}
