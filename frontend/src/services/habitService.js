import { api } from "./apiClient";

// Construye el query string ignorando valores vacíos.
function qs(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

// Endpoints de hábitos (definición) y sus ocurrencias (entries). Ver memory/api_contract.md.
export const habitService = {
  list: () => api.get("/habits"),
  create: (data) => api.post("/habits", data), // -> { habit, occurrences }
  update: (id, data) => api.put(`/habits/${id}`, data),
  remove: (id) => api.del(`/habits/${id}`),
  entries: (range = {}) => api.get(`/habits/entries${qs(range)}`),
  updateEntry: (entryId, data) => api.put(`/habits/entries/${entryId}`, data),
  removeEntry: (entryId) => api.del(`/habits/entries/${entryId}`),
  stats: (period) => api.get(`/habits/stats${qs({ period })}`),
};
