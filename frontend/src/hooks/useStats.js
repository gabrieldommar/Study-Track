import { useCallback, useEffect, useState } from "react";

import { sessionService } from "../services/sessionService";
import { habitService } from "../services/habitService";

// Carga las estadísticas de estudio y hábitos para un período (week|month).
export function useStats(period) {
  const [data, setData] = useState({ study: [], habits: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [study, habits] = await Promise.all([
        sessionService.stats(period),
        habitService.stats(period),
      ]);
      setData({ study, habits });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...data, loading, error, reload: load };
}
