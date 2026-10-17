// Grabación de video personal para el coach.
// Límite de 3 minutos (sección 8), cámara trasera preferida, 1280x720 objetivo,
// sin audio (decisión de implementación, no requisito explícito de San).
// Límite de tamaño para adjuntos existentes: 80 MB (mismo límite documentado).

export const MAX_RECORDING_SECONDS = 180;
export const MAX_ATTACHMENT_BYTES = 80 * 1024 * 1024;
export const ACCEPTED_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export interface RecordingHandle {
  stream: MediaStream;
  recorder: MediaRecorder;
  stop: () => Promise<{ blob: Blob; durationSeconds: number }>;
}

function pickMimeType(): string {
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
  for (const type of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export async function startRecording(
  videoEl: HTMLVideoElement,
  onAutoStop?: (result: { blob: Blob; durationSeconds: number }) => void
): Promise<RecordingHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  });

  videoEl.srcObject = stream;
  await videoEl.play().catch(() => undefined);

  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];
  const startedAt = Date.now();
  let stopped = false;
  let autoStopTimer: ReturnType<typeof setTimeout> | null = null;

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const finalize = (): { blob: Blob; durationSeconds: number } => {
    const blob = new Blob(chunks, { type: mimeType || "video/webm" });
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
    stream.getTracks().forEach((t) => t.stop());
    videoEl.srcObject = null;
    return { blob, durationSeconds };
  };

  const stop = (): Promise<{ blob: Blob; durationSeconds: number }> =>
    new Promise((resolve) => {
      if (stopped) return;
      stopped = true;
      if (autoStopTimer) clearTimeout(autoStopTimer);
      recorder.onstop = () => resolve(finalize());
      if (recorder.state !== "inactive") recorder.stop();
      else resolve(finalize());
    });

  recorder.start();

  autoStopTimer = setTimeout(() => {
    if (stopped) return;
    stop().then((result) => onAutoStop?.(result));
  }, MAX_RECORDING_SECONDS * 1000);

  return { stream, recorder, stop };
}

export function validateAttachment(file: File): string | null {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return `Formato no admitido (${file.type || "desconocido"}). Usa MP4, MOV o WebM.`;
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB; el máximo es 80 MB.`;
  }
  return null;
}
