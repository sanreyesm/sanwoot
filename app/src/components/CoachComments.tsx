import type { Prescription } from "../types";

// Notas de la pauta y comentarios que la coach dejó como "comentario de celda"
// en el Sheet (no se ven en la celda misma, por eso se copian aquí).
export function CoachComments({ prescription }: { prescription: Prescription }) {
  const comments = prescription.coachComments ?? [];
  if (!prescription.coachNote && comments.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
      {prescription.coachNote && <div style={{ fontSize: 13 }}>{prescription.coachNote}</div>}
      {comments.length > 0 && (
        <>
          <span className="text-muted" style={{ fontSize: 11, fontWeight: 700 }}>Comentarios de tu coach</span>
          {comments.map((c, i) => (
            <div key={i} style={{ fontSize: 13, background: "var(--screen-bg)", borderRadius: 8, padding: "8px 10px" }}>
              {c}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
