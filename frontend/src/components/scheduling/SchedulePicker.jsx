import { useEffect, useMemo, useRef, useState } from "react";

import Input from "../ui/Input";
import { addMonths, startOfMonth, startOfWeek, toISODate } from "../../utils/dates";

// Días de la semana en la convención del backend (0 = lunes … 6 = domingo)
const WEEKDAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const WEEKDAY_SHORT = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

// weekday del backend a partir de un Date (JS: 0=domingo)
const backendWeekday = (date) => (date.getDay() + 6) % 7;

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Devuelve la matriz de 42 celdas (6 semanas) que cubre el mes de `anchor`.
function monthGrid(anchor) {
  const first = startOfWeek(startOfMonth(anchor));
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    return d;
  });
}

// Valida un payload de agendado antes de enviarlo.
export function isScheduleValid(payload) {
  return (
    payload &&
    payload.days.length > 0 &&
    payload.days.every((d) => Number(d.planned_hours) > 0)
  );
}

// Selector de días agendados. Emite { recurring_weekly, days } vía onChange.
// - recurrente: se eligen días de la semana (se repiten cada semana).
// - puntual: se eligen fechas concretas del calendario.
export default function SchedulePicker({ onChange, error }) {
  const [recurring, setRecurring] = useState(true);
  const [anchor, setAnchor] = useState(new Date());
  const [selectedKeys, setSelectedKeys] = useState([]); // weekday (string) o fecha ISO
  const [details, setDetails] = useState({}); // key -> { start_time, planned_hours }

  const today = useMemo(() => new Date(), []);
  const grid = useMemo(() => monthGrid(anchor), [anchor]);

  // onChange puede ser una función inline del padre: la guardamos en ref para
  // no reejecutar el efecto de emisión en cada render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const days = selectedKeys.map((key) => {
      const det = details[key] || {};
      const base = recurring ? { weekday: Number(key) } : { date: key };
      const hours = det.planned_hours;
      return {
        ...base,
        start_time: det.start_time || null,
        planned_hours: hours === "" || hours == null ? null : Number(hours),
      };
    });
    onChangeRef.current?.({ recurring_weekly: recurring, days });
  }, [recurring, selectedKeys, details]);

  const toggleRecurring = (next) => {
    setRecurring(next);
    setSelectedKeys([]); // weekday y fecha son dominios distintos: reiniciamos
    setDetails({});
  };

  const toggleKey = (key) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const onCellClick = (date) => {
    toggleKey(recurring ? String(backendWeekday(date)) : toISODate(date));
  };

  const setDetail = (key, field) => (e) =>
    setDetails((prev) => ({ ...prev, [key]: { ...prev[key], [field]: e.target.value } }));

  const isCellSelected = (date) =>
    recurring
      ? selectedKeys.includes(String(backendWeekday(date)))
      : selectedKeys.includes(toISODate(date));

  const sortedKeys = useMemo(
    () => [...selectedKeys].sort((a, b) => (recurring ? Number(a) - Number(b) : a.localeCompare(b))),
    [selectedKeys, recurring]
  );

  const rowLabel = (key) =>
    recurring ? WEEKDAY_NAMES[Number(key)] : new Date(key + "T00:00:00").toLocaleDateString("es", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => toggleRecurring(e.target.checked)}
          className="accent-primary"
        />
        Repetir cada semana
      </label>
      <p className="text-xs text-muted">
        {recurring
          ? "Elegí los días de la semana; se repiten automáticamente."
          : "Elegí las fechas puntuales en el calendario."}
      </p>

      {/* Mini calendario */}
      <div className="rounded-xl border border-line bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={() => setAnchor(addMonths(anchor, -1))} className="px-2 text-muted hover:text-ink" aria-label="Mes anterior">‹</button>
          <span className="text-sm font-medium capitalize text-ink">
            {anchor.toLocaleDateString("es", { month: "long", year: "numeric" })}
          </span>
          <button type="button" onClick={() => setAnchor(addMonths(anchor, 1))} className="px-2 text-muted hover:text-ink" aria-label="Mes siguiente">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
          {WEEKDAY_SHORT.map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((date) => {
            const inMonth = date.getMonth() === anchor.getMonth();
            const selected = isCellSelected(date);
            const isToday = isSameDay(date, today);
            return (
              <button
                key={toISODate(date)}
                type="button"
                onClick={() => onCellClick(date)}
                className={`h-9 rounded-lg text-sm transition-colors
                  ${selected ? "bg-primary text-white" : "hover:bg-primary-soft text-ink"}
                  ${inMonth ? "" : "text-muted/40"}
                  ${isToday && !selected ? "ring-1 ring-primary" : ""}`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {/* Detalle por día seleccionado: hora de inicio + horas planeadas */}
      {sortedKeys.length > 0 && (
        <div className="space-y-2">
          <p className="field-label">Horario y horas por día</p>
          {sortedKeys.map((key) => (
            <div key={key} className="flex items-end gap-2">
              <span className="w-24 shrink-0 pb-2.5 text-sm capitalize text-ink">{rowLabel(key)}</span>
              <Input
                id={`start-${key}`}
                label="Inicio"
                type="time"
                value={details[key]?.start_time || ""}
                onChange={setDetail(key, "start_time")}
                className="w-32"
              />
              <Input
                id={`hours-${key}`}
                label="Horas"
                type="number"
                min="0"
                step="0.5"
                value={details[key]?.planned_hours ?? ""}
                onChange={setDetail(key, "planned_hours")}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
