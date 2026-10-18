import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "../state/SessionContext";
import { getExercise } from "../data/exercises";
import { getPrescription } from "../data/prescription";
import { resolveDemoFile } from "../data/demo-map";
import { DemoPlayer } from "../components/DemoPlayer";
import { Icon } from "../components/Icon";
import { Badge } from "../components/Badge";
import { getLastSetsForExercise } from "../lib/db";
import { saveClip, listClipsForExercise, deleteClip } from "../lib/clips-db";
import { startRecording, validateAttachment, MAX_RECORDING_SECONDS, type RecordingHandle } from "../lib/camera";
import type { PersonalClip, SetResult } from "../types";

export function EjercicioScreen() {
  const { exerciseId = "" } = useParams();
  const navigate = useNavigate();
  const { session, sets, feedback, addSet, removeSet, setFeedback, toggleSkip } = useSession();

  const [lastSets, setLastSets] = useState<SetResult[]>([]);
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [clips, setClips] = useState<PersonalClip[]>([]);

  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordingHandleRef = useRef<RecordingHandle | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    getLastSetsForExercise(exerciseId, session?.id).then(setLastSets);
    listClipsForExercise(exerciseId).then(setClips);
  }, [exerciseId, session?.id]);

  if (!session) {
    return (
      <div className="screen">
        <p>No hay una sesión activa.</p>
        <button className="btn btn--primary" onClick={() => navigate("/")}>Ir a Hoy</button>
      </div>
    );
  }

  const exercise = getExercise(exerciseId);
  const prescription = getPrescription(session.day).find((p) => p.exerciseId === exerciseId);
  if (!exercise || !prescription) {
    return <p className="screen">Ejercicio no encontrado en la pauta de este día.</p>;
  }

  const demo = resolveDemoFile(exerciseId);
  const mySets = sets.filter((s) => s.exerciseId === exerciseId).sort((a, b) => a.index - b.index);
  const fb = feedback.find((f) => f.exerciseId === exerciseId);
  const skipped = session.skippedExerciseIds.includes(exerciseId);
  const rir = fb?.rir ?? 0;

  const order = session.exerciseOrder;
  const currentIndex = order.indexOf(exerciseId);
  const prevId = currentIndex > 0 ? order[currentIndex - 1] : null;
  const nextId = currentIndex < order.length - 1 ? order[currentIndex + 1] : null;
  const nextExercise = nextId ? getExercise(nextId) : null;

  const onAddSet = async () => {
    const r = reps.trim() === "" ? null : Number(reps);
    const w = weight.trim() === "" ? null : Number(weight);
    if (r !== null && Number.isNaN(r)) return;
    if (w !== null && Number.isNaN(w)) return;
    await addSet(exerciseId, r, w);
    setReps("");
    setWeight("");
  };

  const refreshClips = () => listClipsForExercise(exerciseId).then(setClips);

  const beginRecording = async () => {
    setRecordError(null);
    if (!videoPreviewRef.current) return;
    try {
      const handle = await startRecording(videoPreviewRef.current, async (result) => {
        await persistClip(result.blob, result.durationSeconds, "recorded");
        setRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      });
      recordingHandleRef.current = handle;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (e) {
      setRecordError(
        e instanceof Error ? `No se pudo acceder a la cámara: ${e.message}` : "No se pudo acceder a la cámara."
      );
    }
  };

  const stopRecording = async () => {
    const handle = recordingHandleRef.current;
    if (!handle) return;
    const result = await handle.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    await persistClip(result.blob, result.durationSeconds, "recorded");
  };

  const persistClip = async (blob: Blob, durationSeconds: number, source: "recorded" | "attached") => {
    const clip: PersonalClip = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      exerciseId,
      createdAt: new Date().toISOString(),
      mimeType: blob.type,
      size: blob.size,
      durationSeconds,
      status: "local",
      source,
    };
    await saveClip(clip, blob);
    await refreshClips();
  };

  const onAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const error = validateAttachment(file);
    if (error) {
      setRecordError(error);
      return;
    }
    setRecordError(null);
    await persistClip(file, undefined as unknown as number, "attached");
  };

  const formatDuration = (s?: number) => (s == null ? "" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);

  return (
    <div className="screen">
      <div className="exercise-nav">
        <button className="exercise-nav__back" onClick={() => navigate("/rutina")}>
          <Icon name="chevron-left" size={24} strokeWidth={2.6} />
          Rutina
        </button>
        <div className="exercise-nav__pager">
          <button className="icon-btn" aria-label={prevId ? `Ejercicio anterior: ${getExercise(prevId)?.name}` : "Sin ejercicio anterior"} disabled={!prevId} onClick={() => prevId && navigate(`/ejercicio/${prevId}`)}>
            <Icon name="chevron-left" size={22} strokeWidth={2.6} />
          </button>
          <span className="exercise-nav__count">{currentIndex + 1} de {order.length}</span>
          <button className="icon-btn" aria-label={nextId ? `Ejercicio siguiente: ${getExercise(nextId)?.name}` : "Sin ejercicio siguiente"} disabled={!nextId} onClick={() => nextId && navigate(`/ejercicio/${nextId}`)}>
            <Icon name="chevron-right" size={22} strokeWidth={2.6} />
          </button>
        </div>
      </div>

      <div className="eyebrow">{exercise.floor && (exercise.floor === "unknown" ? "Piso por confirmar" : `Piso ${exercise.floor}`)} · Día {session.day}</div>
      <h1 style={{ fontSize: 34 }}>{exercise.name}</h1>

      <DemoPlayer file={demo.file} confidence={demo.confidence} note={demo.note} referenceUrl={exercise.referenceUrl} />

      {exercise.needsConfirmation && (
        <div role="note" className="banner banner--warn">
          <Icon name="warning" size={24} strokeWidth={2.4} />
          <div>
            <div className="banner__title">Por confirmar con el coach</div>
            <div>{exercise.confirmationNote}</div>
          </div>
        </div>
      )}

      <section className="card">
        <p className="card__title">Pauta del coach</p>
        <dl className="stat-grid">
          <div>
            <dt>Series</dt>
            <dd>{prescription.sets}</dd>
          </div>
          <div>
            <dt>Reps</dt>
            <dd style={{ fontSize: prescription.repsText && prescription.repsText.length > 8 ? 20 : 32 }}>{prescription.repsText ?? "–"}</dd>
          </div>
          <div>
            <dt>Carga</dt>
            <dd style={{ fontSize: prescription.loadText && prescription.loadText.length > 8 ? 18 : 32 }}>{prescription.loadText ?? "–"}</dd>
          </div>
        </dl>
        <div style={{ fontSize: 16, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
          <span className="text-muted">Equipo</span> <strong>{exercise.equipment}</strong>
        </div>
      </section>

      {lastSets.length > 0 && (
        <section className="card card--muted">
          <p className="card__title">
            <Icon name="history" size={16} strokeWidth={2.4} /> La vez anterior
          </p>
          <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {lastSets.map((s) => `${s.reps ?? "–"} × ${s.weightKg ?? "–"}kg`).join(" · ")}
          </div>
        </section>
      )}

      <section className="card card--current">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="card__title" style={{ margin: 0, color: "var(--accent-light-text)", fontWeight: 800 }}>Hoy</p>
          <Badge variant="partial">{mySets.length} de {prescription.sets} series</Badge>
        </div>
        <ul className="set-history" aria-label="Series registradas hoy">
          {mySets.map((s, i) => (
            <li key={s.id} className="set-history__row">
              <span className="set-history__label">Serie {i + 1}</span>
              <span className="set-history__value">{s.reps ?? "–"} × {s.weightKg ?? "–"} kg</span>
              <button className="icon-btn icon-btn--danger" aria-label={`Quitar serie ${i + 1}: ${s.reps ?? "–"} reps con ${s.weightKg ?? "–"} kg`} onClick={() => removeSet(s.id)}>
                <Icon name="close" size={20} strokeWidth={2.6} />
              </button>
            </li>
          ))}
        </ul>
        <div className="set-input">
          <div className="set-input__field">
            <label htmlFor="reps-input">Reps · serie {mySets.length + 1}</label>
            <input id="reps-input" type="text" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} />
          </div>
          <div className="set-input__field">
            <label htmlFor="weight-input">Peso (kg)</label>
            <input id="weight-input" type="text" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <button className="btn btn--primary" onClick={onAddSet}>
            <Icon name="plus" size={22} strokeWidth={3} />
            Agregar serie {mySets.length + 1}
          </button>
        </div>
      </section>

      <section className="card">
        <p className="card__title"><label htmlFor="rir-range">RIR de la última serie</label></p>
        <div className="stepper">
          <div className="stepper__value">
            <span className="stepper__number">{rir}</span>
            <span className="stepper__unit">reps en reserva</span>
          </div>
          <div className="stepper__row">
            <button className="stepper__btn" aria-label={`Bajar RIR a ${Math.max(0, rir - 1)}`} onClick={() => setFeedback(exerciseId, { rir: Math.max(0, rir - 1) })}>−</button>
            <input
              id="rir-range"
              type="range"
              min={0}
              max={5}
              step={1}
              value={rir}
              aria-valuetext={`${rir} reps en reserva`}
              onChange={(e) => setFeedback(exerciseId, { rir: Number(e.target.value) })}
            />
            <button className="stepper__btn" aria-label={`Subir RIR a ${Math.min(5, rir + 1)}`} onClick={() => setFeedback(exerciseId, { rir: Math.min(5, rir + 1) })}>+</button>
          </div>
        </div>
      </section>

      <div className="set-input__field">
        <label htmlFor="comment-input">Comentario (opcional)</label>
        <textarea
          id="comment-input"
          rows={3}
          placeholder="Cómo se sintió, molestias, ajustes"
          value={fb?.note ?? ""}
          onChange={(e) => setFeedback(exerciseId, { note: e.target.value })}
        />
      </div>

      <section className="card">
        <p className="card__title">Grabarte · hasta {MAX_RECORDING_SECONDS / 60} min</p>
        <video ref={videoPreviewRef} className="camera-preview" playsInline muted />
        {recording ? (
          <>
            <p>Grabando… {elapsed}s / {MAX_RECORDING_SECONDS}s</p>
            <button className="btn btn--primary" onClick={stopRecording}>Terminar grabación</button>
          </>
        ) : (
          <div className="camera-actions">
            <button className="btn btn--record" onClick={beginRecording}>
              <Icon name="record-dot" size={18} />
              Grabar
            </button>
            <button className="btn btn--outline" onClick={() => fileInputRef.current?.click()}>
              <Icon name="attach" size={18} />
              Adjuntar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              style={{ display: "none" }}
              onChange={onAttach}
            />
          </div>
        )}
        {recordError && (
          <div role="alert" className="banner banner--error">
            <Icon name="warning" size={22} strokeWidth={2.4} />
            <div>{recordError}</div>
          </div>
        )}

        {clips.map((c) => (
          <div key={c.id} className="clip-row">
            <button className="clip-row__thumb" aria-label={`Reproducir video, ${formatDuration(c.durationSeconds)}`}>
              <Icon name="play" size={20} />
            </button>
            <div className="clip-row__meta">
              <div className="clip-row__title">{c.source === "recorded" ? "Grabación" : "Adjunto"} · {formatDuration(c.durationSeconds)}</div>
              <Badge variant="device">Guardado en este dispositivo</Badge>
            </div>
          </div>
        ))}
        {clips.length > 0 && (
          <div className="camera-actions">
            <button className="btn btn--outline">
              <Icon name="share" size={18} /> Compartir
            </button>
            <button
              className="btn btn--outline"
              style={{ borderColor: "var(--error-text)", color: "var(--error-text)" }}
              onClick={async () => {
                await deleteClip(clips[0].id);
                refreshClips();
              }}
            >
              <Icon name="trash" size={18} /> Eliminar
            </button>
          </div>
        )}
      </section>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {nextExercise && (
          <button className="btn btn--primary btn--large" onClick={() => nextId && navigate(`/ejercicio/${nextId}`)}>
            Siguiente · {nextExercise.name}
            <Icon name="arrow-right" size={20} strokeWidth={2.8} />
          </button>
        )}
        <button className="btn btn--neutral" style={{ width: "100%", minHeight: 52 }} onClick={() => toggleSkip(exerciseId)}>
          <Icon name="skip" size={18} />
          {skipped ? "Deshacer omitir" : "Omitir este ejercicio"}
        </button>
      </div>
    </div>
  );
}
