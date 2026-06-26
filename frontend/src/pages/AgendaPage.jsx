import { useState } from "react";

import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import { EmptyState, ErrorMessage } from "../components/ui/Feedback";
import { useCalendar } from "../hooks/useCalendar";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  formatDayLabel,
  formatRangeLabel,
  startOfMonth,
  startOfWeek,
} from "../utils/dates";

// Devuelve el rango [from, to] según el modo y la fecha ancla.
function rangeFor(anchor, mode) {
  return mode === "month"
    ? [startOfMonth(anchor), endOfMonth(anchor)]
    : [startOfWeek(anchor), endOfWeek(anchor)];
}

export default function AgendaPage() {
  const [mode, setMode] = useState("week");
  const [anchor, setAnchor] = useState(new Date());
  const [from, to] = rangeFor(anchor, mode);
  const { days, habitNames, loading, error } = useCalendar(from, to);

  const shift = (dir) =>
    setAnchor((prev) => (mode === "month" ? addMonths(prev, dir) : addDays(prev, dir * 7)));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl text-ink">Agenda</h1>
          <p className="text-sm text-muted">Tus sesiones y hábitos en el tiempo.</p>
        </div>
        <div className="inline-flex rounded-lg bg-primary-soft p-1">
          {["week", "month"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                mode === m ? "bg-surface text-primary-dark shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {m === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-lg capitalize text-ink">{formatRangeLabel(from, to, mode)}</p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="py-1.5" onClick={() => shift(-1)} aria-label="Anterior">
            ‹
          </Button>
          <Button variant="ghost" className="py-1.5" onClick={() => setAnchor(new Date())}>
            Hoy
          </Button>
          <Button variant="ghost" className="py-1.5" onClick={() => shift(1)} aria-label="Siguiente">
            ›
          </Button>
        </div>
      </div>

      {loading ? (
        <Spinner label="Cargando agenda..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : !days.length ? (
        <EmptyState message="No hay actividad en este período." />
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <DayBlock key={day.date} day={day} habitNames={habitNames} />
          ))}
        </div>
      )}
    </div>
  );
}

function DayBlock({ day, habitNames }) {
  return (
    <div className="card p-4">
      <p className="mb-3 text-sm font-medium capitalize text-muted">{formatDayLabel(day.date)}</p>
      <div className="space-y-2">
        {day.sessions.map((s) => {
          const isDone = s.status === "completed";
          return (
            <div key={`s-${s.id}`} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${isDone ? "bg-primary" : "bg-accent"}`} />
                <span className="truncate text-ink">{s.topic}</span>
                <span className="truncate text-xs text-muted">{s.category_path}</span>
              </div>
              <span className="shrink-0 text-muted">
                {isDone ? `${s.completed_hours}h` : `${s.planned_hours}h`}
              </span>
            </div>
          );
        })}
        {day.logs.map((log) => (
          <div key={`l-${log.id}`} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary-dark/40" />
              <span className="truncate text-ink">{habitNames[log.habit_id] ?? "Hábito"}</span>
              <span className="text-xs text-muted">hábito</span>
            </div>
            <span className="shrink-0 text-muted">{log.duration}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
