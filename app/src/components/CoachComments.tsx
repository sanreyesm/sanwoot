import type { Prescription } from "../types";

// Notas de la pauta y comentarios que la coach dejó como "comentario de celda"
// en el Sheet (no se ven en la celda misma, por eso se copian aquí).
export function CoachComments({ prescription }: { prescription: Prescription }) {
  const comments = prescription.coachComments ?? [];
  const previous = prescription.previousCoachComments ?? [];
  if (!prescription.coachNote && comments.length === 0 && previous.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
      {prescription.coachNote && <div style={{ fontSize: 13 }}>{prescription.coachNote}</div>}
      <CommentList title="Comentarios de tu coach" comments={comments} />
      <CommentList title="De semanas anteriores" comments={previous} muted />
    </div>
  );
}

function CommentList({ title, comments, muted }: { title: string; comments: string[]; muted?: boolean }) {
  if (comments.length === 0) return null;
  return (
    <>
      <span className="text-muted" style={{ fontSize: 11, fontWeight: 700 }}>{title}</span>
      {comments.map((c, i) => (
        <div
          key={i}
          className={muted ? "text-muted" : undefined}
          style={{ fontSize: 13, background: "var(--screen-bg)", borderRadius: 8, padding: "8px 10px" }}
        >
          {c}
        </div>
      ))}
    </>
  );
}
