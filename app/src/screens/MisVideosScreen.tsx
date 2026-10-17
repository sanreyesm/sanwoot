import { useEffect, useMemo, useState } from "react";
import { deleteClip, getClipBlob, listClips } from "../lib/clips-db";
import { getExercise } from "../data/exercises";
import type { PersonalClip } from "../types";

export function MisVideosScreen() {
  const [clips, setClips] = useState<PersonalClip[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>("all");

  const refresh = async () => {
    const all = await listClips();
    setClips(all);
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    return () => {
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exerciseIds = useMemo(() => Array.from(new Set(clips.map((c) => c.exerciseId))), [clips]);

  const ensureUrl = async (clip: PersonalClip) => {
    if (urls[clip.id]) return;
    const blob = await getClipBlob(clip.id);
    if (!blob) return;
    setUrls((prev) => ({ ...prev, [clip.id]: URL.createObjectURL(blob) }));
  };

  const share = async (clip: PersonalClip) => {
    const blob = await getClipBlob(clip.id);
    if (!blob) return;
    const ext = clip.mimeType.includes("mp4") ? "mp4" : clip.mimeType.includes("quicktime") ? "mov" : "webm";
    const file = new File([blob], `sanwoot-${clip.exerciseId}-${clip.createdAt}.${ext}`, { type: clip.mimeType });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Video para el coach" });
        return;
      } catch {
        // Si cancela o falla el selector nativo, cae al enlace de descarga.
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visible = filter === "all" ? clips : clips.filter((c) => c.exerciseId === filter);

  return (
    <div className="screen">
      <h1>Mis videos</h1>
      <p className="text-muted">
        Grabaciones personales guardadas en este teléfono. No hay subida a la nube todavía: compartir
        usa el selector nativo del celular.
      </p>

      {exerciseIds.length > 0 && (
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select">
          <option value="all">Todos los ejercicios</option>
          {exerciseIds.map((id) => (
            <option key={id} value={id}>{getExercise(id)?.name ?? id}</option>
          ))}
        </select>
      )}

      {visible.length === 0 && <p className="text-muted">Sin videos todavía.</p>}

      <ul className="clip-list clip-list--grid">
        {visible.map((clip) => (
          <li key={clip.id} className="clip-card">
            <p className="clip-card__title">{getExercise(clip.exerciseId)?.name ?? clip.exerciseId}</p>
            <p className="text-muted">{new Date(clip.createdAt).toLocaleString("es-CL")}</p>
            <video
              className="clip-card__video"
              controls
              playsInline
              src={urls[clip.id]}
              onPlay={() => ensureUrl(clip)}
              onLoadStart={() => ensureUrl(clip)}
            />
            <p className="text-muted">{(clip.size / 1024 / 1024).toFixed(1)} MB · Guardado en este dispositivo</p>
            <div className="camera-actions">
              <button className="btn btn--secondary" onClick={() => share(clip)}>Compartir</button>
              <button
                className="btn btn--outline"
                onClick={async () => {
                  await deleteClip(clip.id);
                  refresh();
                }}
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
