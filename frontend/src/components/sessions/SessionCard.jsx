import { formatDayLabel } from "../../utils/dates";

// Tarjeta de una sesión de estudio. Muestra estado planeada/completada.
export default function SessionCard({ session, onDelete }) {
  const isDone = session.status === "completed";
  return (
    <div className="card flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${isDone ? "bg-primary" : "bg-accent"}`} />
          <p className="truncate font-medium text-ink">{session.topic}</p>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted">{session.category_path}</p>
        <p className="mt-1 text-xs text-muted">{formatDayLabel(session.date)}</p>
      </div>
      <div className="flex items-center gap-4 text-right">
        <div>
          <p className="text-sm font-medium text-ink">
            {isDone ? `${session.completed_hours}h` : `${session.planned_hours}h`}
          </p>
          <p className="text-xs text-muted">{isDone ? "completadas" : "planeadas"}</p>
        </div>
        <button
          onClick={() => onDelete(session.id)}
          className="text-xs text-muted transition-colors hover:text-danger"
          aria-label="Eliminar sesión"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
