import { useState } from "react";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Spinner from "../ui/Spinner";
import { ErrorMessage } from "../ui/Feedback";
import { useHabitLogs } from "../../hooks/useHabitLogs";
import { formatDayLabel, toISODate } from "../../utils/dates";

const FREQ_LABEL = { daily: "Diario", weekly: "Semanal" };

export default function HabitCard({ habit, onDelete }) {
  const { logs, loading, error, add, remove } = useHabitLogs(habit.id);
  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState({ date: toISODate(new Date()), duration: "" });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const setField = (key) => (e) => setEntry((s) => ({ ...s, [key]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!(Number(entry.duration) > 0)) return setFormError("Horas > 0");
    setFormError(null);
    setSaving(true);
    try {
      await add({ date: entry.date, duration: Number(entry.duration) });
      setEntry({ date: toISODate(new Date()), duration: "" });
      setOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{habit.name}</p>
          <p className="mt-0.5 text-sm text-muted">
            {FREQ_LABEL[habit.frequency]} · {habit.target_duration}h objetivo
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button variant="ghost" className="py-1.5" onClick={() => setOpen((o) => !o)}>
            {open ? "Cerrar" : "Registrar"}
          </Button>
          <button
            onClick={() => onDelete(habit.id)}
            className="text-xs text-muted transition-colors hover:text-danger"
            aria-label="Eliminar hábito"
          >
            Eliminar
          </button>
        </div>
      </div>

      {open && (
        <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
          <Input id={`date-${habit.id}`} label="Fecha" type="date" value={entry.date} onChange={setField("date")} />
          <Input
            id={`dur-${habit.id}`}
            label="Horas"
            type="number"
            min="0"
            step="0.5"
            value={entry.duration}
            onChange={setField("duration")}
            className="w-28"
          />
          <Button type="submit" disabled={saving} className="py-2.5">
            {saving ? "..." : "Agregar"}
          </Button>
          {formError && <ErrorMessage message={formError} />}
        </form>
      )}

      <div className="mt-4 border-t border-line pt-3">
        {loading ? (
          <Spinner label="Cargando registros..." />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : !logs.length ? (
          <p className="text-xs text-muted">Sin registros todavía.</p>
        ) : (
          <ul className="space-y-1.5">
            {logs.slice(0, 5).map((log) => (
              <li key={log.id} className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted">{formatDayLabel(log.date)}</span>
                <span className="flex items-center gap-3">
                  <span className="text-ink">{log.duration}h</span>
                  <button
                    onClick={() => remove(log.id)}
                    className="text-xs text-muted transition-colors hover:text-danger"
                    aria-label="Eliminar registro"
                  >
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
