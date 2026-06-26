import { useCallback, useEffect, useState } from "react";

import { habitService } from "../services/habitService";

// Carga los registros de un hábito y permite agregar/eliminar.
export function useHabitLogs(habitId) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await habitService.logs(habitId);
      setLogs(data.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [habitId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(async (data) => {
    await habitService.addLog(habitId, data);
    await load();
  }, [habitId, load]);

  const remove = useCallback(async (logId) => {
    await habitService.removeLog(logId);
    setLogs((prev) => prev.filter((l) => l.id !== logId));
  }, []);

  return { logs, loading, error, reload: load, add, remove };
}
