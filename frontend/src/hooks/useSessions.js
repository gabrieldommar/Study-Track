import { useCallback, useEffect, useState } from "react";

import { sessionService } from "../services/sessionService";

// Maneja la lista de sesiones y las operaciones CRUD con sus estados de carga/error.
export function useSessions(filters = {}) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const key = JSON.stringify(filters);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSessions(await sessionService.list(filters));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(async (data) => {
    await sessionService.create(data);
    await load();
  }, [load]);

  const remove = useCallback(async (id) => {
    await sessionService.remove(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { sessions, loading, error, reload: load, create, remove };
}
