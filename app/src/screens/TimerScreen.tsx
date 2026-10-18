import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { Badge } from "../components/Badge";

// Timer genérico para ejercicios (ej. plancha) o descansos entre series.
// Secundario a propósito: lo principal de la app sigue siendo ver la pauta
// del día, esto es un apoyo opcional.
const PRESETS = [30, 45, 60, 90, 120];

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TimerScreen() {
  const [mode, setMode] = useState<"countdown" | "stopwatch">("countdown");
  const [presetSeconds, setPresetSeconds] = useState(60);
  const [customInput, setCustomInput] = useState("");
  const [remaining, setRemaining] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const clearTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const start = () => {
    setFinished(false);
    setRunning(true);
    clearTimer();
    intervalRef.current = setInterval(() => {
      if (mode === "countdown") {
        setRemaining((r) => {
          if (r <= 1) {
            clearTimer();
            setRunning(false);
            setFinished(true);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return 0;
          }
          return r - 1;
        });
      } else {
        setElapsed((e) => e + 1);
      }
    }, 1000);
  };

  const pause = () => {
    setRunning(false);
    clearTimer();
  };

  const reset = () => {
    pause();
    setFinished(false);
    setRemaining(presetSeconds);
    setElapsed(0);
  };

  const choosePreset = (seconds: number) => {
    pause();
    setFinished(false);
    setPresetSeconds(seconds);
    setRemaining(seconds);
  };

  const applyCustom = () => {
    const n = Math.round(Number(customInput) * 60);
    if (!Number.isFinite(n) || n <= 0) return;
    choosePreset(n);
    setCustomInput("");
  };

  const switchMode = (next: "countdown" | "stopwatch") => {
    pause();
    setFinished(false);
    setMode(next);
    setRemaining(presetSeconds);
    setElapsed(0);
  };

  return (
    <div className="screen">
      <div className="eyebrow">Opción secundaria</div>
      <h1>Timer</h1>
      <p className="text-muted">Para descansos entre series o ejercicios por tiempo, como la plancha.</p>

      <div className="day-picker" role="group" aria-label="Tipo de timer">
        <button
          type="button"
          aria-pressed={mode === "countdown"}
          className={`day-picker__btn${mode === "countdown" ? " day-picker__btn--selected" : ""}`}
          onClick={() => switchMode("countdown")}
        >
          Cuenta regresiva
        </button>
        <button
          type="button"
          aria-pressed={mode === "stopwatch"}
          className={`day-picker__btn${mode === "stopwatch" ? " day-picker__btn--selected" : ""}`}
          onClick={() => switchMode("stopwatch")}
        >
          Cronómetro
        </button>
      </div>

      <section className="card" style={{ alignItems: "center", textAlign: "center" }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 72,
            fontVariantNumeric: "tabular-nums",
            color: finished ? "var(--accent)" : "var(--ink)",
          }}
        >
          {formatTime(mode === "countdown" ? remaining : elapsed)}
        </span>
        {finished && <Badge variant="device">¡Tiempo!</Badge>}
        <div className="camera-actions" style={{ width: "100%" }}>
          {!running ? (
            <button className="btn btn--primary" onClick={start} disabled={mode === "countdown" && remaining === 0}>
              <Icon name="play" size={18} /> {elapsed > 0 || remaining !== presetSeconds ? "Continuar" : "Empezar"}
            </button>
          ) : (
            <button className="btn btn--outline" onClick={pause}>Pausar</button>
          )}
          <button className="btn btn--neutral" onClick={reset}>
            <Icon name="undo" size={16} /> Reiniciar
          </button>
        </div>
      </section>

      {mode === "countdown" && (
        <section className="card">
          <p className="card__title">Preestablecidos</p>
          <div className="filter-row">
            {PRESETS.map((s) => (
              <button
                key={s}
                className={`filter-chip${presetSeconds === s ? " filter-chip--active" : ""}`}
                onClick={() => choosePreset(s)}
              >
                {s < 60 ? `${s}s` : `${s / 60}min`}
              </button>
            ))}
          </div>
          <div className="set-input" style={{ gridTemplateColumns: "1fr auto" }}>
            <div className="set-input__field">
              <label htmlFor="custom-min">Minutos a mano</label>
              <input id="custom-min" type="text" inputMode="decimal" value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="Ej. 1.5" />
            </div>
            <button className="btn btn--secondary" style={{ alignSelf: "end", minHeight: 64 }} onClick={applyCustom}>Usar</button>
          </div>
        </section>
      )}
    </div>
  );
}

