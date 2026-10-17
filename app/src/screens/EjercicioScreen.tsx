import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "../state/SessionContext";
import { getExercise } from "../data/exercises";
import { getPrescription } from "../data/prescription";
import { resolveDemoFile } from "../data/demo-map";
import { DemoPlayer } from "../components/DemoPlayer";
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

  const order = session.exerciseOrder;
  const currentIndex = order.indexOf(exerciseId);
  const prevId = currentIndex > 0 ? order[currentIndex - 1] : null;
  const nextId = currentIndex < order.length - 1 ? order[currentIndex + 1] : null;

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
        e instanceof Error
          ? `No se pudo acceder a la cámara: ${e.message}`
          : "No se pudo acceder a la cámara."
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

  return (
    <div className="screen">
      <div className="exercise-nav">
        <button disabled={!prevId} onClick={() => prevId && navigate(`/ejercicio/${prevId}`)}>‹ Anterior</button>
        <button onClick={() => navigate("/rutina")}>Rutina</button>
        <button disabled={!nextId} onClick={() => nextId && navigate(`/ejercicio/${nextId}`)}>Siguiente ›</button>
      </div>

      <h1>{exercise.name}</h1>
      {exercise.needsConfirmation && (
        <p className="banner banner--warn">⚠️ Pendiente de confirmar: {exercise.confirmationNote}</p>
      )}

      <DemoPlayer file={demo.file} confidence={demo.confidence} note={demo.note} referenceUrl={exercise.referenceUrl} />

      <div className="card">
        <p className="card__title">Pauta del coach</p>
        <p>{prescription.sets} series · {prescription.repsText ?? "repeticiones no indicadas"}</p>
        <p>{prescription.loadText ?? "sin carga indicada"}</p>
        {prescription.coachNote && <p className="text-muted">{prescription.coachNote}</p>}
        <p className="text-muted">{exercise.equipment}</p>
      </div>

      {lastSets.length > 0 && (
        <div className="card">
          <p className="card__title">Última vez realizado</p>
          <ul className="set-history">
            {lastSets.map((s, i) => (
              <li key={s.id}>
                Serie {i + 1}: {s.reps ?? "–"} reps{s.weightKg != null ? ` · ${s.weightKg} kg` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <p className="card__title">Registrar serie de hoy</p>
        <ul className="set-history">
          {mySets.map((s, i) => (
            <li key={s.id}>
              Serie {i + 1}: {s.reps ?? "–"} reps{s.weightKg != null ? ` · ${s.weightKg} kg` : ""}
              <button className="link-btn" onClick={() => removeSet(s.id)}>quitar</button>
            </li>
          ))}
        </ul>
        <div className="set-input">
          <input
            inputMode="numeric"
            placeholder="Reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
          <input
            inputMode="decimal"
            placeholder="Peso (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <button className="btn btn--secondary" onClick={onAddSet}>Agregar serie</button>
        </div>
      </div>

      <div className="card">
        <p className="card__title">RIR y comentario</p>
        <label>
          RIR de la última serie
          <input
            inputMode="numeric"
            value={fb?.rir ?? ""}
            onChange={(e) => setFeedback(exerciseId, { rir: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </label>
        <label>
          Comentario
          <textarea
            value={fb?.note ?? ""}
            onChange={(e) => setFeedback(exerciseId, { note: e.target.value })}
            placeholder="Molestias, sensaciones, lo que sea relevante"
          />
        </label>
      </div>

      <div className="card">
        <p className="card__title">Video para el coach</p>
        <video ref={videoPreviewRef} className="camera-preview" playsInline muted />
        {recording ? (
          <>
            <p>Grabando… {elapsed}s / {MAX_RECORDING_SECONDS}s</p>
            <button className="btn btn--primary" onClick={stopRecording}>Terminar grabación</button>
          </>
        ) : (
          <div className="camera-actions">
            <button className="btn btn--secondary" onClick={beginRecording}>Grabar</button>
            <button className="btn btn--secondary" onClick={() => fileInputRef.current?.click()}>
              Adjuntar de Fotos
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
        {recordError && <p className="banner banner--error">{recordError}</p>}

        {clips.length > 0 && (
          <ul className="clip-list">
            {clips.map((c) => (
              <li key={c.id}>
                {new Date(c.createdAt).toLocaleString("es-CL")} · {(c.size / 1024 / 1024).toFixed(1)} MB
                <span className="badge badge--muted">Guardado en este dispositivo</span>
                <button
                  className="link-btn"
                  onClick={async () => {
                    await deleteClip(c.id);
                    refreshClips();
                  }}
                >
                  eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="btn btn--outline" onClick={() => toggleSkip(exerciseId)}>
        {skipped ? "Deshacer omitir" : "Omitir este ejercicio"}
      </button>
    </div>
  );
}
