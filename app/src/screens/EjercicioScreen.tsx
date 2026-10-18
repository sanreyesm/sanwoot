import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "../state/SessionContext";
import { getExercise } from "../data/exercises";
import { getPrescription } from "../data/prescription";
import { resolveDemo } from "../data/demo-map";
import { DemoPlayer } from "../components/DemoPlayer";
import { DemoPicker } from "../components/DemoPicker";
import { Icon } from "../components/Icon";
import { Badge } from "../components/Badge";
import { getLastSetsForExercise } from "../lib/db";
import { saveClip, listClipsForExercise, deleteClip, getClipBlob } from "../lib/clips-db";
import { validateAttachment } from "../lib/camera";
import { setOverride } from "../lib/exercise-overrides";
import { floorLabel } from "../data/exercise-options";
import type { PersonalClip, SetResult } from "../types";

export function EjercicioScreen() {
  const { exerciseId = "" } = useParams();
  const navigate = useNavigate();
  const { session, sets, feedback, addSet, removeSet, setFeedback, toggleSkip } = useSession();

  const [lastSets, setLastSets] = useState<SetResult[]>([]);
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [clips, setClips] = useState<PersonalClip[]>([]);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [myNote, setMyNote] = useState("");
  const [editingNote, setEditingNote] = useState(false);
  const [draftNote, setDraftNote] = useState("");
  const [demoVersion, setDemoVersion] = useState(0);
  const recordInputRef = useRef<HTMLInputElement | null>(null);
  const attachInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    getLastSetsForExercise(exerciseId, session?.id).then(setLastSets);
    listClipsForExercise(exerciseId).then(setClips);
  }, [exerciseId, session?.id]);

  useEffect(() => {
    setMyNote(getExercise(exerciseId)?.myNote ?? "");
    setEditingNote(false);
  }, [exerciseId]);

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

  const demo = resolveDemo(exerciseId);
  const mySets = sets.filter((s) => s.exerciseId === exerciseId).sort((a, b) => a.index - b.index);
  const fb = feedback.find((f) => f.exerciseId === exerciseId);
  const skipped = session.skippedExerciseIds.includes(exerciseId);
  const rir = fb?.rir ?? 0;
  const videoSent = fb?.videoSent ?? false;

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

  const startEditingNote = () => {
    setDraftNote(myNote);
    setEditingNote(true);
  };

  const saveNote = () => {
    setMyNote(draftNote);
    setOverride(exerciseId, { myNote: draftNote });
    setEditingNote(false);
  };

  const persistClip = async (file: File, source: "recorded" | "attached") => {
    const error = validateAttachment(file);
    if (error) {
      setVideoError(error);
      return;
    }
    setVideoError(null);
    const clip: PersonalClip = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      exerciseId,
      createdAt: new Date().toISOString(),
      mimeType: file.type,
      size: file.size,
      status: "local",
      source,
    };
    await saveClip(clip, file);
    await refreshClips();
  };

  const onFileSelected = (source: "recorded" | "attached") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await persistClip(file, source);
  };

  const play = async (clip: PersonalClip) => {
    const blob = await getClipBlob(clip.id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.playsInline = true;
    video.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:50;background:#000";
    video.onclick = () => video.remove();
    document.body.appendChild(video);
    video.play();
  };

  return (
    <div className="screen">
      <div className="exercise-nav">
        <button className="exercise-nav__back" onClick={() => navigate("/rutina")}>
          <Icon name="chevron-left" size={19} strokeWidth={2.6} />
          Rutina
        </button>
        <div className="exercise-nav__pager">
          <button className="icon-btn" aria-label={prevId ? `Ejercicio anterior: ${getExercise(prevId)?.name}` : "Sin ejercicio anterior"} disabled={!prevId} onClick={() => prevId && navigate(`/ejercicio/${prevId}`)}>
            <Icon name="chevron-left" size={18} strokeWidth={2.6} />
          </button>
          <span className="exercise-nav__count">{currentIndex + 1} de {order.length}</span>
          <button className="icon-btn" aria-label={nextId ? `Ejercicio siguiente: ${getExercise(nextId)?.name}` : "Sin ejercicio siguiente"} disabled={!nextId} onClick={() => nextId && navigate(`/ejercicio/${nextId}`)}>
            <Icon name="chevron-right" size={18} strokeWidth={2.6} />
          </button>
        </div>
      </div>

      <div className="eyebrow">
        {exercise.muscleGroup ? `${exercise.muscleGroup} · ` : ""}
        {floorLabel(exercise.floor)} · Día {session.day}
      </div>
      <h1 style={{ fontSize: 27 }}>{exercise.name}</h1>

      <DemoPlayer
        key={demoVersion}
        file={demo.file}
        confidence={demo.confidence}
        note={demo.note}
        referenceUrl={exercise.referenceUrl}
        youtubeUrl={demo.youtubeUrl}
        chosenByUser={demo.chosenByUser}
      />
      <DemoPicker exerciseId={exerciseId} active={!!demo.chosenByUser} onChange={() => setDemoVersion((v) => v + 1)} />

      <div className="set-input__field">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label htmlFor="my-note" style={{ margin: 0 }}>
            <Icon name="device" size={11} strokeWidth={2.4} /> Tu nota privada (solo para ti, nunca se le envía a tu entrenadora)
          </label>
          {!editingNote && (
            <button className="icon-btn" aria-label="Editar tu nota" onClick={startEditingNote} style={{ width: 29, height: 29 }}>
              ✏️
            </button>
          )}
        </div>
        <textarea
          id="my-note"
          rows={2}
          placeholder='Ej. "es con mancuerna", "en COROS es el parecido a este pero con plancha normal"'
          value={editingNote ? draftNote : myNote}
          disabled={!editingNote}
          onChange={(e) => setDraftNote(e.target.value)}
          style={editingNote ? undefined : { background: "var(--screen-bg)", color: "var(--muted)" }}
        />
        {editingNote ? (
          <div className="camera-actions">
            <button className="btn btn--primary" onClick={saveNote}>Guardar</button>
            <button className="btn btn--outline" onClick={() => setEditingNote(false)}>Cancelar</button>
          </div>
        ) : (
          <span className="text-muted" style={{ fontSize: 10, textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>
            Queda guardada siempre para este ejercicio, no solo en la sesión de hoy.
          </span>
        )}
      </div>

      {exercise.needsConfirmation && (
        <div role="note" className="banner banner--warn">
          <Icon name="warning" size={19} strokeWidth={2.4} />
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
        <div style={{ fontSize: 13, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
          <span className="text-muted">Equipo</span> <strong>{exercise.equipment}</strong>
        </div>
      </section>

      {lastSets.length > 0 && (
        <section className="card card--muted">
          <p className="card__title">
            <Icon name="history" size={13} strokeWidth={2.4} /> La vez anterior
          </p>
          <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
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
                <Icon name="close" size={16} strokeWidth={2.6} />
              </button>
            </li>
          ))}
        </ul>
        <div className="set-input">
          <div className="set-input__field">
            <label htmlFor="reps-input">Reps · serie {mySets.length + 1}</label>
            <input id="reps-input" className="input--big" type="text" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} />
          </div>
          <div className="set-input__field">
            <label htmlFor="weight-input">Peso (kg)</label>
            <input id="weight-input" className="input--big" type="text" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <button className="btn btn--primary" onClick={onAddSet}>
            <Icon name="plus" size={18} strokeWidth={3} />
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
        <label htmlFor="comment-input">
          <Icon name="share" size={11} strokeWidth={2.4} /> Comentario para tu entrenadora (opcional)
        </label>
        <textarea
          id="comment-input"
          rows={3}
          placeholder="Cómo se sintió, molestias, ajustes"
          value={fb?.note ?? ""}
          onChange={(e) => setFeedback(exerciseId, { note: e.target.value })}
        />
        <span className="text-muted" style={{ fontSize: 10, textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>
          Va en el resumen que compartes al terminar la sesión. Uno por ejercicio, de hoy.
        </span>
      </div>

      <section className="card">
        <p className="card__title">Video para el coach</p>

        <button
          type="button"
          className="connection-row"
          style={{ border: "none", background: "none", textAlign: "left", cursor: "pointer", padding: "5px 0" }}
          onClick={() => setFeedback(exerciseId, { videoSent: !videoSent })}
        >
          <div className="connection-row__head">
            <span className="connection-row__name">¿Enviaste el video a tu coach?</span>
            <Badge variant={videoSent ? "complete" : "pending"}>{videoSent ? "Enviado" : "Pendiente"}</Badge>
          </div>
          <div className="text-muted">Lo marcas tú, igual que en la planilla. No se envía nada automático.</div>
        </button>

        <div className="camera-actions">
          <button className="btn btn--record" onClick={() => recordInputRef.current?.click()}>
            <Icon name="record-dot" size={14} />
            Grabar
          </button>
          <button className="btn btn--outline" onClick={() => attachInputRef.current?.click()}>
            <Icon name="attach" size={14} />
            Adjuntar
          </button>
          {/* capture="environment" abre la cámara nativa real (con selector de
              lente, incluido el gran angular 0.5x, y su propio botón de detener):
              no es una simulación, es la app Cámara del sistema. */}
          <input
            ref={recordInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={onFileSelected("recorded")}
          />
          <input
            ref={attachInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            style={{ display: "none" }}
            onChange={onFileSelected("attached")}
          />
        </div>

        {videoError && (
          <div role="alert" className="banner banner--error">
            <Icon name="warning" size={18} strokeWidth={2.4} />
            <div>{videoError}</div>
          </div>
        )}

        {clips.map((c) => (
          <div key={c.id} className="clip-row">
            <button className="clip-row__thumb" aria-label="Reproducir video" onClick={() => play(c)}>
              <Icon name="play" size={16} />
            </button>
            <div className="clip-row__meta">
              <div className="clip-row__title">{c.source === "recorded" ? "Grabación" : "Adjunto"} · {(c.size / 1024 / 1024).toFixed(1)} MB</div>
              <Badge variant="device">Guardado en este dispositivo</Badge>
            </div>
            <button
              className="icon-btn icon-btn--danger"
              aria-label="Eliminar video"
              onClick={async () => {
                await deleteClip(c.id);
                refreshClips();
              }}
            >
              <Icon name="trash" size={14} />
            </button>
          </div>
        ))}
      </section>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {nextExercise && (
          <button className="btn btn--primary btn--large" onClick={() => nextId && navigate(`/ejercicio/${nextId}`)}>
            Siguiente · {nextExercise.name}
            <Icon name="arrow-right" size={16} strokeWidth={2.8} />
          </button>
        )}
        <button className="btn btn--neutral" style={{ width: "100%", minHeight: 42 }} onClick={() => toggleSkip(exerciseId)}>
          <Icon name="skip" size={14} />
          {skipped ? "Deshacer omitir" : "Omitir este ejercicio"}
        </button>
      </div>
    </div>
  );
}
