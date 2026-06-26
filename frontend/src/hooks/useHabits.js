import { useCallback, useEffect, useState } from "react";

import { habitService } from "../services/habitService";

// Maneja la lista de hábitos y sus operaciones CRUD.
export function useHabits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHabits(await habitService.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(async (data) => {
    const created = await habitService.create(data);
    setHabits((prev) => [...prev, created]);
    return created;
  }, []);

  const remove = useCallback(async (id) => {
    await habitService.remove(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  return { habits, loading, error, reload: load, create, remove };
}
