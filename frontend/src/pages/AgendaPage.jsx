import { useMemo, useState } from "react";

import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Spinner from "../components/ui/Spinner";
import { EmptyState, ErrorMessage } from "../components/ui/Feedback";
import { useCalendar } from "../hooks/useCalendar";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  formatDayLabel,
  startOfMonth,
  startOfWeek,
  toISODate,
} from "../utils/dates";

const WEEKDAY_SHORT = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function monthGrid(anchor) {
  const first = startOfWeek(startOfMonth(anchor));
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    return d;
  });
}

export default function AgendaPage() {
  const today = useMemo(() => new Date(), []);
  const [anchor, setAnchor] = useState(new Date());
  const [selectedISO, setSelectedISO] = useState(toISODate(new Date()));

  const gridFrom = startOfWeek(startOfMonth(anchor));
  const gridTo = endOfWeek(endOfMonth(anchor));
  const { byDate, habitNames, loading, error, completeSession, completeEntry } =
    useCalendar(gridFrom, gridTo);

  const grid = useMemo(() => monthGrid(anchor), [anchor]);

  const selectedActivities = useMemo(() => {
    const day = byDate[selectedISO];
    if (!day) return [];
    const sessions = day.sessions.map((s) => ({
      key: `s-${s.id}`, id: s.id, kind: "session", name: s.topic, sub: s.category_path,
      start_time: s.start_time, planned_hours: s.planned_hours, completed_hours: s.completed_hours, status: s.status,
    }));
    const entries = day.entries.map((e) => ({
      key: `e-${e.id}`, id: e.id, kind: "entry", name: habitNames[e.habit_id] ?? "Hábito", sub: "hábito",
      start_time: e.start_time, planned_hours: e.planned_hours, completed_hours: e.completed_hours, status: e.status,
    }));
    return [...sessions, ...entries].sort((a, b) =>
      (a.start_time || "99").localeCompare(b.start_time || "99")
    );
  }, [byDate, selectedISO, habitNames]);

  const onComplete = (act, hours) =>
    act.kind === "session" ? completeSession(act.id, hours) : completeEntry(act.id, hours);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl text-ink">Agenda</h1>
        <p className="text-sm text-muted">Tu mes de estudio y hábitos. Seleccioná un día para ver el detalle.</p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-lg capitalize text-ink">
          {anchor.toLocaleDateString("es", { month: "long", year: "numeric" })}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="py-1.5" onClick={() => setAnchor(addMonths(anchor, -1))} aria-label="Mes anterior">‹</Button>
          <Button variant="ghost" className="py-1.5" onClick={() => { setAnchor(new Date()); setSelectedISO(toISODate(new Date())); }}>Hoy</Button>
          <Button variant="ghost" className="py-1.5" onClick={() => setAnchor(addMonths(anchor, 1))} aria-label="Mes siguiente">›</Button>
        </div>
      </div>

      {error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          {/* Grilla del mes */}
          <div className="card p-3">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
              {WEEKDAY_SHORT.map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((date) => {
                const iso = toISODate(date);
                const inMonth = date.getMonth() === anchor.getMonth();
                const day = byDate[iso];
                const count = day ? day.sessions.length + day.entries.length : 0;
                const isToday = isSameDay(date, today);
                const isSelected = iso === selectedISO;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedISO(iso)}
                    className={`flex h-16 flex-col items-center justify-start gap-1 rounded-lg p-1.5 text-sm transition-colors
                      ${isSelected ? "bg-primary text-white" : "hover:bg-primary-soft text-ink"}
                      ${inMonth ? "" : "opacity-40"}
                      ${isToday && !isSelected ? "ring-1 ring-primary" : ""}`}
                  >
                    <span className={isToday && !isSelected ? "font-semibold text-primary" : ""}>{date.getDate()}</span>
                    {count > 0 && (
                      <span className={`text-[10px] ${isSelected ? "text-white/90" : "text-muted"}`}>
                        {count} act.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detalle del día */}
          <div className="card p-4">
            <p className="mb-3 text-sm font-medium capitalize text-ink">{formatDayLabel(selectedISO)}</p>
            {loading ? (
              <Spinner label="Cargando..." />
            ) : !selectedActivities.length ? (
              <EmptyState message="Sin actividades este día." />
            ) : (
              <div className="space-y-3">
                {selectedActivities.map((act) => (
                  <ActivityRow key={act.key} activity={act} onComplete={onComplete} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityRow({ activity, onComplete }) {
  const isDone = activity.status === "completed";
  const [hours, setHours] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const save = async () => {
    if (!(Number(hours) > 0)) return setErr("Horas > 0");
    setErr(null);
    setSaving(true);
    try {
      await onComplete(activity, Number(hours));
    } catch (e) {
      setErr(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-line p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{activity.name}</p>
          <p className="truncate text-xs text-muted">
            {activity.start_time ? activity.start_time.slice(0, 5) + " · " : ""}{activity.sub}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${isDone ? "bg-primary-soft text-primary-dark" : "bg-accent/10 text-accent"}`}>
          {isDone ? "cumplido" : "pendiente"}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs text-muted">
        <span>Planeado: <span className="text-ink">{activity.planned_hours}h</span></span>
        <span>Cumplido: <span className="text-ink">{isDone ? `${activity.completed_hours}h` : "—"}</span></span>
      </div>

      {!isDone && (
        <div className="mt-3 flex items-end gap-2 border-t border-line pt-3">
          <Input
            id={`done-${activity.key}`}
            label="Horas cumplidas"
            type="number"
            min="0"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="flex-1"
          />
          <Button type="button" className="py-2.5" disabled={saving} onClick={save}>
            {saving ? "..." : "Guardar"}
          </Button>
        </div>
      )}
      {err && <p className="mt-1 text-xs text-danger">{err}</p>}
    </div>
  );
}
