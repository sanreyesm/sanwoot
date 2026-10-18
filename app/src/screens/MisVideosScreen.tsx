import { useEffect, useMemo, useState } from "react";
import { deleteClip, getClipBlob, listClips } from "../lib/clips-db";
import { getExercise } from "../data/exercises";
import { Icon } from "../components/Icon";
import { Badge } from "../components/Badge";
import type { PersonalClip } from "../types";

function formatDuration(s?: number): string {
  if (s == null) return "";
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
}

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
  const totalMb = clips.reduce((sum, c) => sum + c.size, 0) / 1024 / 1024;

  const ensureUrl = async (clip: PersonalClip) => {
    if (urls[clip.id]) return urls[clip.id];
    const blob = await getClipBlob(clip.id);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    setUrls((prev) => ({ ...prev, [clip.id]: url }));
    return url;
  };

  const play = async (clip: PersonalClip) => {
    const url = await ensureUrl(clip);
    if (!url) return;
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.playsInline = true;
    video.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:50;background:#000";
    video.onclick = () => video.remove();
    document.body.appendChild(video);
    video.play();
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
        // cancelado o sin soporte: cae al enlace de descarga
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
      <div className="eyebrow">{clips.length} videos · {totalMb.toFixed(0)} MB</div>
      <h1>Mis videos</h1>

      <div role="note" className="banner" style={{ background: "var(--accent-light-bg)", color: "var(--accent-light-text)" }}>
        <Icon name="device" size={22} strokeWidth={2.2} />
        <div>
          <div className="banner__title">Solo en este teléfono</div>
          <div>Nada se sube a la nube todavía. Si borras la app o cambias de teléfono, se pierden. Compártelos para respaldarlos.</div>
        </div>
      </div>

      {exerciseIds.length > 0 && (
        <div role="group" aria-label="Filtrar por ejercicio" className="filter-row">
          <button className={`filter-chip${filter === "all" ? " filter-chip--active" : ""}`} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
            {filter === "all" && <Icon name="check" size={14} strokeWidth={3} />}
            Todos · {clips.length}
          </button>
          {exerciseIds.map((id) => {
            const count = clips.filter((c) => c.exerciseId === id).length;
            return (
              <button key={id} className={`filter-chip${filter === id ? " filter-chip--active" : ""}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>
                {getExercise(id)?.name ?? id} · {count}
              </button>
            );
          })}
        </div>
      )}

      {visible.length === 0 && <p className="text-muted">Sin videos todavía.</p>}

      <ul className="clip-list clip-list--grid">
        {visible.map((clip) => (
          <li key={clip.id} className="clip-card">
            <button className="clip-card__thumb" aria-label={`Reproducir video, ${formatDuration(clip.durationSeconds)}`} onClick={() => play(clip)}>
              <Icon name="play" size={28} />
              {clip.durationSeconds != null && <span className="clip-card__duration">{formatDuration(clip.durationSeconds)}</span>}
            </button>
            <div className="clip-card__body">
              <p className="clip-card__title">{getExercise(clip.exerciseId)?.name ?? clip.exerciseId}</p>
              <span className="clip-card__date">{new Date(clip.createdAt).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}</span>
              <Badge variant="device">{(clip.size / 1024 / 1024).toFixed(1)} MB</Badge>
              <div className="camera-actions">
                <button className="icon-btn" aria-label="Compartir video" onClick={() => share(clip)}>
                  <Icon name="share" size={20} />
                </button>
                <button
                  className="icon-btn icon-btn--danger"
                  aria-label="Eliminar video"
                  onClick={async () => {
                    await deleteClip(clip.id);
                    refresh();
                  }}
                >
                  <Icon name="trash" size={20} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
