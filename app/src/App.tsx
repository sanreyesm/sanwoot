import { HashRouter, Route, Routes } from "react-router-dom";
import { SessionProvider } from "./state/SessionContext";
import { BottomNav } from "./components/BottomNav";
import { HoyScreen } from "./screens/HoyScreen";
import { RutinaScreen } from "./screens/RutinaScreen";
import { EjercicioScreen } from "./screens/EjercicioScreen";
import { CierreScreen } from "./screens/CierreScreen";
import { HistorialScreen } from "./screens/HistorialScreen";
import { MisVideosScreen } from "./screens/MisVideosScreen";
import { AjustesScreen } from "./screens/AjustesScreen";
import { TimerScreen } from "./screens/TimerScreen";
import "./App.css";

export default function App() {
  return (
    <SessionProvider>
      <HashRouter>
        <div className="app-shell">
          <main className="app-main">
            <Routes>
              <Route path="/" element={<HoyScreen />} />
              <Route path="/rutina" element={<RutinaScreen />} />
              <Route path="/ejercicio/:exerciseId" element={<EjercicioScreen />} />
              <Route path="/cierre" element={<CierreScreen />} />
              <Route path="/historial" element={<HistorialScreen />} />
              <Route path="/videos" element={<MisVideosScreen />} />
              <Route path="/ajustes" element={<AjustesScreen />} />
              <Route path="/timer" element={<TimerScreen />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </HashRouter>
    </SessionProvider>
  );
}
