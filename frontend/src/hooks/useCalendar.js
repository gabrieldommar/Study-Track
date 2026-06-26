import { useCallback, useEffect, useState } from "react";

import { api } from "../services/apiClient";
import { sessionService } from "../services/sessionService";
import { toISODate } from "../utils/dates";

// Carga las sesiones y registros de hábitos de un rango y los agrupa por día.
export function useCalendar(from, to) {
  const [data, setData] = useState({ days: [], habitNames: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fromISO = toISODate(from);
  const toISO = toISODate(to);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Habits para resolver el nombre de cada registro (los logs solo traen habit_id)
      const [calendar, habits] = await Promise.all([
        sessionService.calendar(fromISO, toISO),
        api.get("/habits"),
      ]);
      const habitNames = Object.fromEntries(habits.map((h) => [h.id, h.name]));

      // Agrupa por fecha: { date: { sessions: [], logs: [] } }
      const byDate = {};
      for (const s of calendar.sessions) {
        (byDate[s.date] ??= { sessions: [], logs: [] }).sessions.push(s);
      }
      for (const log of calendar.habit_logs) {
        (byDate[log.date] ??= { sessions: [], logs: [] }).logs.push(log);
      }
      const days = Object.entries(byDate)
        .map(([date, items]) => ({ date, ...items }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setData({ days, habitNames });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fromISO, toISO]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...data, loading, error, reload: load };
}
