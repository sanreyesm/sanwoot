import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { SessionProvider } from "./state/SessionContext";
import { BottomNav } from "./components/BottomNav";
import { HoyScreen } from "./screens/HoyScreen";
import { DiaPreviewScreen } from "./screens/DiaPreviewScreen";
import { EjercicioPreviewScreen } from "./screens/EjercicioPreviewScreen";
import { RutinaScreen } from "./screens/RutinaScreen";
import { EjercicioScreen } from "./screens/EjercicioScreen";
import { CierreScreen } from "./screens/CierreScreen";
import { HistorialScreen } from "./screens/HistorialScreen";
import { MisVideosScreen } from "./screens/MisVideosScreen";
import { AjustesScreen } from "./screens/AjustesScreen";
import { TimerScreen } from "./screens/TimerScreen";
import "./App.css";

// La vista informativa (/dia/...) reemplaza el nav inferior por su propio
// botón fijo "Hacer rutina": mostrar ambos a la vez sería confuso y dejaría
// escapar a otra pantalla en medio de una vista que todavía no es una sesión.
function AppShell() {
  const location = useLocation();
  const hideNav = location.pathname.startsWith("/dia/");
  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HoyScreen />} />
          <Route path="/dia/:day" element={<DiaPreviewScreen />} />
          <Route path="/dia/:day/ejercicio/:exerciseId" element={<EjercicioPreviewScreen />} />
          <Route path="/rutina" element={<RutinaScreen />} />
          <Route path="/ejercicio/:exerciseId" element={<EjercicioScreen />} />
          <Route path="/cierre" element={<CierreScreen />} />
          <Route path="/historial" element={<HistorialScreen />} />
          <Route path="/videos" element={<MisVideosScreen />} />
          <Route path="/ajustes" element={<AjustesScreen />} />
          <Route path="/timer" element={<TimerScreen />} />
        </Routes>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <HashRouter>
        <AppShell />
      </HashRouter>
    </SessionProvider>
  );
}
