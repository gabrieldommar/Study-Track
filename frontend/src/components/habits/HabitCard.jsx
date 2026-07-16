// Tarjeta de un hábito (definición). El cumplimiento se registra en la Agenda.
export default function HabitCard({ habit, onDelete }) {
  const untilLabel = habit.horizon_end
    ? new Date(habit.horizon_end + "T00:00:00").toLocaleDateString("es", { day: "numeric", month: "short" })
    : null;

  return (
    <div className="card flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{habit.name}</p>
        <p className="mt-0.5 text-sm text-muted">
          {habit.recurring_weekly ? `Semanal · agendado hasta ${untilLabel}` : "Fechas puntuales"}
        </p>
      </div>
      <button
        onClick={() => onDelete(habit.id)}
        className="shrink-0 text-xs text-muted transition-colors hover:text-danger"
        aria-label="Eliminar hábito"
      >
        Eliminar
      </button>
    </div>
  );
}
