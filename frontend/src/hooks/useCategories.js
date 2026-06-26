import { useCallback, useEffect, useState } from "react";

import { categoryService } from "../services/categoryService";

// Carga las categorías del usuario y expone una acción para crear nuevas.
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await categoryService.list());
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
    const created = await categoryService.create(data);
    setCategories((prev) => [...prev, created]);
    return created;
  }, []);

  return { categories, loading, error, reload: load, create };
}
