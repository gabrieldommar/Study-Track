import { useCallback, useEffect, useState } from "react";

import { habitService } from "../services/habitService";
import { sessionService } from "../services/sessionService";
import { toISODate } from "../utils/dates";

// Carga sesiones y ocurrencias de hábitos de un rango, agrupadas por día.
// Expone acciones para registrar horas cumplidas.
export function useCalendar(from, to) {
  const [data, setData] = useState({ byDate: {}, habitNames: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fromISO = toISODate(from);
  const toISO = toISODate(to);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [calendar, habits] = await Promise.all([
        sessionService.calendar(fromISO, toISO),
        habitService.list(),
      ]);
      const habitNames = Object.fromEntries(habits.map((h) => [h.id, h.name]));

      const byDate = {};
      for (const s of calendar.sessions) {
        (byDate[s.date] ??= { sessions: [], entries: [] }).sessions.push(s);
      }
      for (const e of calendar.habit_entries) {
        (byDate[e.date] ??= { sessions: [], entries: [] }).entries.push(e);
      }
      setData({ byDate, habitNames });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fromISO, toISO]);

  useEffect(() => {
    load();
  }, [load]);

  const completeSession = useCallback(async (id, hours) => {
    await sessionService.update(id, { completed_hours: hours, status: "completed" });
    await load();
  }, [load]);

  const completeEntry = useCallback(async (id, hours) => {
    await habitService.updateEntry(id, { completed_hours: hours, status: "completed" });
    await load();
  }, [load]);

  return { ...data, loading, error, reload: load, completeSession, completeEntry };
}
