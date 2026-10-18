// Video personal para el coach.
//
// La grabación usa <input type="file" capture="environment" accept="video/*">
// en vez de getUserMedia/MediaRecorder: eso abre la app Cámara nativa de
// verdad (selector de lente incluido, botón de detener incluido), algo que
// una grabación dentro de la página no puede igualar — en particular, Safari
// en iOS no deja elegir el lente ultra gran angular (0.5x) desde una captura
// web. Al usar la cámara nativa se pierde el límite de 3 minutos impuesto
// por la app durante la grabación (eso lo decide el sistema operativo); el
// límite de tamaño de 80 MB sigue aplicándose después, al validar el archivo.
//
// Límite de tamaño: 80 MB (mismo límite ya documentado para adjuntos).

export const MAX_ATTACHMENT_BYTES = 80 * 1024 * 1024;
export const ACCEPTED_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export function validateAttachment(file: File): string | null {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return `Formato no admitido (${file.type || "desconocido"}). Usa MP4, MOV o WebM.`;
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB; el máximo es 80 MB.`;
  }
  return null;
}
