import { useEffect, useMemo, useState } from "react";
import { buildSessionSummaryText, shareSessionSummary } from "../lib/session-summary";
import { listSessions, getSetsForSession, getFeedbackForSession, deleteSession } from "../lib/db";
import { getExercise } from "../data/exercises";
import { buildBackup, buildSessionsCsv, downloadCsv, downloadJson } from "../lib/export";
import { CopyChip } from "../components/CopyChip";
import { Icon } from "../components/Icon";
import { Badge, type BadgeVariant } from "../components/Badge";
import type { ExerciseFeedback, SetResult, WorkoutSession } from "../types";

const STATUS: Record<WorkoutSession["status"], { label: string; variant: BadgeVariant }> = {
  active: { label: "Activa", variant: "partial" },
  partial: { label: "Parcial", variant: "partial" },
  complete: { label: "Completa", variant: "complete" },
};

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Construye la grilla del mes, semanas de lunes a domingo, con relleno de
// días de los meses vecinos para completar la cuadrícula.
function buildMonthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const firstWeekday = (first.getDay() + 6) % 7; // 0 = lunes
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - firstWeekday);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

// Coma decimal, como se escribe en la planilla ("2,5").
function formatKg(kg: number | null | undefined): string {
  return kg == null ? "-" : String(kg).replace(".", ",");
}

export function HistorialScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ sets: SetResult[]; feedback: ExerciseFeedback[] } | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [shareStatus, setShareStatus] = useState<"copied" | "manual" | null>(null);

  useEffect(() => {
    listSessions().then((all) => {
      setSessions(all);
      if (all.length > 0) {
        const latest = new Date(all[0].startedAt);
        setMonth(startOfMonth(latest));
        setSelectedDate(dateKey(latest));
      }
    });
  }, []);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    for (const s of sessions) {
      const key = dateKey(new Date(s.startedAt));
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return map;
  }, [sessions]);

  useEffect(() => {
    setConfirmingDelete(false);
    setShareStatus(null);
    if (!selectedDate) {
      setDetail(null);
      return;
    }
    const daySessions = sessionsByDate.get(selectedDate);
    if (!daySessions || daySessions.length === 0) {
      setDetail(null);
      return;
    }
    const session = daySessions[0];
    Promise.all([getSetsForSession(session.id), getFeedbackForSession(session.id)]).then(([sets, feedback]) =>
      setDetail({ sets, feedback })
    );
  }, [selectedDate, sessionsByDate]);

  const grid = buildMonthGrid(month);
  const monthLabelRaw = month.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  const monthLabel = monthLabelRaw.charAt(0).toUpperCase() + monthLabelRaw.slice(1);
  const todayKey = dateKey(new Date());

  const selectedSession = selectedDate ? sessionsByDate.get(selectedDate)?.[0] : null;

  // Abre la hoja de compartir del iPhone (donde aparece WhatsApp) con el
  // mismo resumen que se arma al cerrar una sesión.
  const onShareSession = async () => {
    if (!selectedSession || !detail) return;
    const result = await shareSessionSummary(buildSessionSummaryText(selectedSession, detail.sets, detail.feedback));
    setShareStatus(result === "shared" ? null : result);
  };

  const onDeleteSession = async () => {
    if (!selectedSession) return;
    await deleteSession(selectedSession.id);
    const remaining = await listSessions();
    setSessions(remaining);
    setConfirmingDelete(false);
    setSelectedDate(null);
    setDetail(null);
  };

  return (
    <div className="screen">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div className="eyebrow">Tus sesiones</div>
          <h1>Historial</h1>
        </div>
        <div style={{ position: "relative" }}>
          <button className="icon-btn" aria-label="Exportar" aria-haspopup="true" aria-expanded={exportMenuOpen} onClick={() => setExportMenuOpen((v) => !v)}>
            <Icon name="download" size={16} strokeWidth={2.2} />
          </button>
          {exportMenuOpen && (
            <>
              <div onClick={() => setExportMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 19 }} />
              <div
                className="card"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 5px)",
                  zIndex: 20,
                  minWidth: 180,
                  padding: 6,
                  gap: 2,
                }}
              >
                <button
                  className="btn btn--neutral"
                  style={{ width: "100%", justifyContent: "flex-start" }}
                  onClick={async () => {
                    setExportMenuOpen(false);
                    downloadCsv(await buildSessionsCsv(), `sanwoot-sesiones-${Date.now()}.csv`);
                  }}
                >
                  Exportar CSV
                </button>
                <button
                  className="btn btn--neutral"
                  style={{ width: "100%", justifyContent: "flex-start" }}
                  onClick={async () => {
                    setExportMenuOpen(false);
                    downloadJson(await buildBackup(), `sanwoot-respaldo-${Date.now()}.json`);
                  }}
                >
                  Exportar JSON
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <section className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button className="icon-btn" aria-label="Mes anterior" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
            <Icon name="chevron-left" size={16} strokeWidth={2.6} />
          </button>
          <p className="card__title" style={{ margin: 0, textTransform: "none" }}>{monthLabel}</p>
          <button className="icon-btn" aria-label="Mes siguiente" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
            <Icon name="chevron-right" size={16} strokeWidth={2.6} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 3, textAlign: "center" }}>
          {WEEKDAY_LABELS.map((w, i) => (
            <span key={i} className="eyebrow" style={{ fontSize: 9 }}>{w}</span>
          ))}
          {grid.map((d) => {
            const key = dateKey(d);
            const inMonth = d.getMonth() === month.getMonth();
            const daySessions = sessionsByDate.get(key);
            const status = daySessions?.[0]?.status;
            const isSelected = key === selectedDate;
            return (
              <button
                key={key}
                disabled={!daySessions}
                onClick={() => setSelectedDate(key)}
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  border: isSelected ? "2px solid var(--accent)" : "none",
                  borderRadius: 12,
                  background: isSelected ? "var(--accent-light-bg)" : "transparent",
                  color: inMonth ? "var(--ink)" : "var(--border-strong)",
                  fontWeight: key === todayKey ? 800 : 500,
                  fontSize: 12,
                  cursor: daySessions ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {d.getDate()}
                {daySessions && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 3,
                      width: 5,
                      height: 5,
                      borderRadius: 999,
                      background: status === "complete" ? "var(--complete)" : "var(--accent)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {sessions.length === 0 && <p className="text-muted">Todavía no hay sesiones guardadas.</p>}

      {selectedSession && detail && (
        <section className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <p className="card__title" style={{ margin: 0 }}>
              {new Date(selectedSession.startedAt).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })} · Día {selectedSession.day}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Badge variant={STATUS[selectedSession.status].variant}>{STATUS[selectedSession.status].label}</Badge>
              <button className="icon-btn" aria-label="Compartir resumen de esta sesión" onClick={onShareSession}>
                <Icon name="share" size={15} strokeWidth={2.2} />
              </button>
            </div>
          </div>
          {shareStatus === "copied" && <p className="text-muted">Resumen copiado. Pégalo en WhatsApp.</p>}
          {shareStatus === "manual" && <p className="text-muted">Este navegador no permite compartir ni copiar automáticamente.</p>}
          {(selectedSession.rpe != null || selectedSession.sessionNote) && (
            <div className="copy-chips">
              {selectedSession.rpe != null && <CopyChip label="RPE final" value={String(selectedSession.rpe)} />}
              {selectedSession.sessionNote && <CopyChip label="Fin de sesión" value={selectedSession.sessionNote} />}
            </div>
          )}
          <ul className="set-history">
            {selectedSession.exerciseOrder.map((exerciseId) => {
              const name = getExercise(exerciseId)?.name ?? exerciseId;
              const exSets = detail.sets.filter((s) => s.exerciseId === exerciseId);
              const fb = detail.feedback.find((f) => f.exerciseId === exerciseId);
              const isSkipped = selectedSession.skippedExerciseIds.includes(exerciseId);
              if (isSkipped) {
                return (
                  <li key={exerciseId} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                    <Badge variant="skipped">Omitido</Badge>
                  </li>
                );
              }
              if (exSets.length === 0) {
                return (
                  <li key={exerciseId} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                    <Badge variant="unregistered">Sin registrar</Badge>
                  </li>
                );
              }
              return (
                <li key={exerciseId} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                  <div style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                    {exSets.map((s) => `${s.reps ?? "–"} × ${formatKg(s.weightKg)}`).join(" · ")} kg
                  </div>
                  <div className="copy-chips">
                    <CopyChip label="Reps" value={exSets.map((s) => s.reps ?? "-").join("/")} />
                    <CopyChip label="Carga" value={exSets.map((s) => formatKg(s.weightKg)).join("/")} />
                    {fb?.rir != null && <CopyChip label="RIR" value={String(fb.rir)} />}
                    {fb?.note && <CopyChip label="Comentario" value={fb.note} />}
                  </div>
                </li>
              );
            })}
          </ul>
          {confirmingDelete && (
            <div className="banner banner--error">
              <Icon name="warning" size={18} strokeWidth={2.4} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div>¿Eliminar esta sesión? No se puede deshacer.</div>
                <div className="camera-actions">
                  <button className="btn btn--primary" style={{ background: "var(--error-text)" }} onClick={onDeleteSession}>
                    Sí, eliminar
                  </button>
                  <button className="btn btn--outline" onClick={() => setConfirmingDelete(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
          {!confirmingDelete && (
            <button className="btn btn--outline" style={{ width: "100%", marginTop: 6 }} onClick={() => setConfirmingDelete(true)}>
              <Icon name="trash" size={14} />
              Eliminar sesión
            </button>
          )}
        </section>
      )}
    </div>
  );
}
